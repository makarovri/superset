/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, {
  forwardRef,
  ReactElement,
  ReactNode,
  RefObject,
  UIEvent,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
} from 'react';
import { ensureIsArray, styled, t } from '@superset-ui/core';
import { LabeledValue as AntdLabeledValue } from 'antd/lib/select';
import debounce from 'lodash/debounce';
import { isEqual } from 'lodash';
import Icons from 'src/components/Icons';
import { getClientErrorObject } from 'src/utils/getClientErrorObject';
import { SLOW_DEBOUNCE } from 'src/constants';
import {
  getValue,
  hasOption,
  isLabeledValue,
  DEFAULT_SORT_COMPARATOR,
  EMPTY_OPTIONS,
  MAX_TAG_COUNT,
  SelectOptionsPagePromise,
  SelectOptionsType,
  SelectOptionsTypePage,
  StyledCheckOutlined,
  StyledStopOutlined,
  TOKEN_SEPARATORS,
  renderSelectOptions,
  StyledContainer,
  StyledSelect,
  hasCustomLabels,
  BaseSelectProps,
  sortSelectedFirstHelper,
  sortComparatorWithSearchHelper,
  sortComparatorForNoSearchHelper,
  getSuffixIcon,
  dropDownRenderHelper,
  handleFilterOptionHelper,
} from './utils';

const StyledError = styled.div`
  ${({ theme }) => `
    display: flex;
    justify-content: center;
    align-items: flex-start;
    width: 100%;
    padding: ${theme.gridUnit * 2}px;
    color: ${theme.colors.error.base};
    & svg {
      margin-right: ${theme.gridUnit * 2}px;
    }
  `}
`;

const StyledErrorMessage = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DEFAULT_PAGE_SIZE = 100;

export type AsyncSelectRef = HTMLInputElement & { clearCache: () => void };

export interface AsyncSelectProps extends BaseSelectProps {
  /**
   * It enables the user to create new options.
   * Can be used with standard or async select types.
   * Can be used with any mode, single or multiple.
   * False by default.
   * */
  allowNewOptions?: boolean;
  /**
   * It adds the aria-label tag for accessibility standards.
   * Must be plain English and localized.
   */
  ariaLabel: string;
  /**
   * It adds a header on top of the Select.
   * Can be any ReactNode.
   */
  header?: ReactNode;
  /**
   * It fires a request against the server after
   * the first interaction and not on render.
   * Works in async mode only (See the options property).
   * True by default.
   */
  lazyLoading?: boolean;
  /**
   * It defines whether the Select should allow for the
   * selection of multiple options or single.
   * Single by default.
   */
  mode?: 'single' | 'multiple';
  /**
   * Deprecated.
   * Prefer ariaLabel instead.
   */
  name?: string; // discourage usage
  /**
   * It allows to define which properties of the option object
   * should be looked for when searching.
   * By default label and value.
   */
  optionFilterProps?: string[];
  /**
   * It defines the options of the Select.
   * The options are async, a promise that returns
   * an array of options.
   */
  options: SelectOptionsPagePromise;
  /**
   * It defines how many results should be included
   * in the query response.
   * Works in async mode only (See the options property).
   */
  pageSize?: number;
  /**
   * It shows a stop-outlined icon at the far right of a selected
   * option instead of the default checkmark.
   * Useful to better indicate to the user that by clicking on a selected
   * option it will be de-selected.
   * False by default.
   */
  invertSelection?: boolean;
  /**
   * It fires a request against the server only after
   * searching.
   * Works in async mode only (See the options property).
   * Undefined by default.
   */
  fetchOnlyOnSearch?: boolean;
  /**
   * It provides a callback function when an error
   * is generated after a request is fired.
   * Works in async mode only (See the options property).
   */
  onError?: (error: string) => void;
  /**
   * Customize how filtered options are sorted while users search.
   * Will not apply to predefined `options` array when users are not searching.
   */
  sortComparator?: typeof DEFAULT_SORT_COMPARATOR;
}

const Error = ({ error }: { error: string }) => (
  <StyledError>
    <Icons.ErrorSolid /> <StyledErrorMessage>{error}</StyledErrorMessage>
  </StyledError>
);

const getQueryCacheKey = (value: string, page: number, pageSize: number) =>
  `${value};${page};${pageSize}`;

/**
 * This component is a customized version of the Antdesign 4.X Select component
 * https://ant.design/components/select/.
 * The aim of the component was to combine all the instances of select components throughout the
 * project under one and to remove the react-select component entirely.
 * This Select component provides an API that is tested against all the different use cases of Superset.
 * It limits and overrides the existing Antdesign API in order to keep their usage to the minimum
 * and to enforce simplification and standardization.
 * It is divided into two macro categories, Static and Async.
 * The Static type accepts a static array of options.
 * The Async type accepts a promise that will return the options.
 * Each of the categories come with different abilities. For a comprehensive guide please refer to
 * the storybook in src/components/Select/Select.stories.tsx.
 */
const AsyncSelect = forwardRef(
  (
    {
      allowClear,
      allowNewOptions = false,
      ariaLabel,
      fetchOnlyOnSearch,
      filterOption = true,
      header = null,
      invertSelection = false,
      lazyLoading = true,
      loading,
      mode = 'single',
      name,
      notFoundContent,
      onError,
      onChange,
      onClear,
      onDropdownVisibleChange,
      optionFilterProps = ['label', 'value'],
      options,
      pageSize = DEFAULT_PAGE_SIZE,
      placeholder = t('Select ...'),
      showSearch = true,
      sortComparator = DEFAULT_SORT_COMPARATOR,
      tokenSeparators,
      value,
      getPopupContainer,
      ...props
    }: AsyncSelectProps,
    ref: RefObject<AsyncSelectRef>,
  ) => {
    const isSingleMode = mode === 'single';
    const [selectValue, setSelectValue] = useState(value);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(loading);
    const [error, setError] = useState('');
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingEnabled, setLoadingEnabled] = useState(!lazyLoading);
    const [allValuesLoaded, setAllValuesLoaded] = useState(false);
    const fetchedQueries = useRef(new Map<string, number>());
    const mappedMode = isSingleMode
      ? undefined
      : allowNewOptions
      ? 'tags'
      : 'multiple';
    const allowFetch = !fetchOnlyOnSearch || inputValue;

    const sortSelectedFirst = useCallback(
      (a: AntdLabeledValue, b: AntdLabeledValue) =>
        sortSelectedFirstHelper(a, b, selectValue),
      [selectValue],
    );

    const sortComparatorWithSearch = useCallback(
      (a: AntdLabeledValue, b: AntdLabeledValue) =>
        sortComparatorWithSearchHelper(
          a,
          b,
          inputValue,
          sortSelectedFirst,
          sortComparator,
        ),
      [inputValue, sortComparator, sortSelectedFirst],
    );

    const sortComparatorForNoSearch = useCallback(
      (a: AntdLabeledValue, b: AntdLabeledValue) =>
        sortComparatorForNoSearchHelper(
          a,
          b,
          sortSelectedFirst,
          sortComparator,
        ),
      [sortComparator, sortSelectedFirst],
    );

    const initialOptions = useMemo(
      () =>
        options && Array.isArray(options) ? options.slice() : EMPTY_OPTIONS,
      [options],
    );
    const initialOptionsSorted = useMemo(
      () => initialOptions.slice().sort(sortComparatorForNoSearch),
      [initialOptions, sortComparatorForNoSearch],
    );

    const [selectOptions, setSelectOptions] =
      useState<SelectOptionsType>(initialOptionsSorted);

    // add selected values to options list if they are not in it
    const fullSelectOptions = useMemo(() => {
      const missingValues: SelectOptionsType = ensureIsArray(selectValue)
        .filter(opt => !hasOption(getValue(opt), selectOptions))
        .map(opt =>
          isLabeledValue(opt) ? opt : { value: opt, label: String(opt) },
        );
      return missingValues.length > 0
        ? missingValues.concat(selectOptions)
        : selectOptions;
    }, [selectOptions, selectValue]);

    const handleOnSelect = (
      selectedItem: string | number | AntdLabeledValue | undefined,
    ) => {
      if (isSingleMode) {
        setSelectValue(selectedItem);
      } else {
        setSelectValue(previousState => {
          const array = ensureIsArray(previousState);
          const value = getValue(selectedItem);
          // Tokenized values can contain duplicated values
          if (!hasOption(value, array)) {
            const result = [...array, selectedItem];
            return isLabeledValue(selectedItem)
              ? (result as AntdLabeledValue[])
              : (result as (string | number)[]);
          }
          return previousState;
        });
      }
      setInputValue('');
    };

    const handleOnDeselect = (
      value: string | number | AntdLabeledValue | undefined,
    ) => {
      if (Array.isArray(selectValue)) {
        if (isLabeledValue(value)) {
          const array = selectValue as AntdLabeledValue[];
          setSelectValue(
            array.filter(element => element.value !== value.value),
          );
        } else {
          const array = selectValue as (string | number)[];
          setSelectValue(array.filter(element => element !== value));
        }
      }
      setInputValue('');
    };

    const internalOnError = useCallback(
      (response: Response) =>
        getClientErrorObject(response).then(e => {
          const { error } = e;
          setError(error);

          if (onError) {
            onError(error);
          }
        }),
      [onError],
    );

    const mergeData = useCallback(
      (data: SelectOptionsType) => {
        let mergedData: SelectOptionsType = [];
        if (data && Array.isArray(data) && data.length) {
          // unique option values should always be case sensitive so don't lowercase
          const dataValues = new Set(data.map(opt => opt.value));
          // merges with existing and creates unique options
          setSelectOptions(prevOptions => {
            mergedData = prevOptions
              .filter(previousOption => !dataValues.has(previousOption.value))
              .concat(data)
              .sort(sortComparatorForNoSearch);
            return mergedData;
          });
        }
        return mergedData;
      },
      [sortComparatorForNoSearch],
    );

    const fetchPage = useMemo(
      () => (search: string, page: number) => {
        setPage(page);
        if (allValuesLoaded) {
          setIsLoading(false);
          return;
        }
        const key = getQueryCacheKey(search, page, pageSize);
        const cachedCount = fetchedQueries.current.get(key);
        if (cachedCount !== undefined) {
          setTotalCount(cachedCount);
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        const fetchOptions = options as SelectOptionsPagePromise;
        fetchOptions(search, page, pageSize)
          .then(({ data, totalCount }: SelectOptionsTypePage) => {
            const mergedData = mergeData(data);
            fetchedQueries.current.set(key, totalCount);
            setTotalCount(totalCount);
            if (
              !fetchOnlyOnSearch &&
              value === '' &&
              mergedData.length >= totalCount
            ) {
              setAllValuesLoaded(true);
            }
          })
          .catch(internalOnError)
          .finally(() => {
            setIsLoading(false);
          });
      },
      [
        allValuesLoaded,
        fetchOnlyOnSearch,
        mergeData,
        internalOnError,
        options,
        pageSize,
        value,
      ],
    );

    const debouncedFetchPage = useMemo(
      () => debounce(fetchPage, SLOW_DEBOUNCE),
      [fetchPage],
    );

    const handleOnSearch = (search: string) => {
      const searchValue = search.trim();
      if (allowNewOptions && isSingleMode) {
        const newOption = searchValue &&
          !hasOption(searchValue, fullSelectOptions, true) && {
            label: searchValue,
            value: searchValue,
            isNewOption: true,
          };
        const cleanSelectOptions = fullSelectOptions.filter(
          opt => !opt.isNewOption || hasOption(opt.value, selectValue),
        );
        const newOptions = newOption
          ? [newOption, ...cleanSelectOptions]
          : cleanSelectOptions;
        setSelectOptions(newOptions);
      }
      if (
        !allValuesLoaded &&
        loadingEnabled &&
        !fetchedQueries.current.has(getQueryCacheKey(searchValue, 0, pageSize))
      ) {
        // if fetch only on search but search value is empty, then should not be
        // in loading state
        setIsLoading(!(fetchOnlyOnSearch && !searchValue));
      }
      setInputValue(search);
    };

    const handlePagination = (e: UIEvent<HTMLElement>) => {
      const vScroll = e.currentTarget;
      const thresholdReached =
        vScroll.scrollTop > (vScroll.scrollHeight - vScroll.offsetHeight) * 0.7;
      const hasMoreData = page * pageSize + pageSize < totalCount;

      if (!isLoading && hasMoreData && thresholdReached) {
        const newPage = page + 1;
        fetchPage(inputValue, newPage);
      }
    };

    const handleFilterOption = (search: string, option: AntdLabeledValue) => {
      return handleFilterOptionHelper(
        search,
        option,
        optionFilterProps,
        filterOption,
      );
    };

    const handleOnDropdownVisibleChange = (isDropdownVisible: boolean) => {
      setIsDropdownVisible(isDropdownVisible);

      // loading is enabled when dropdown is open,
      // disabled when dropdown is closed
      if (loadingEnabled !== isDropdownVisible) {
        setLoadingEnabled(isDropdownVisible);
      }
      // when closing dropdown, always reset loading state
      if (!isDropdownVisible && isLoading) {
        // delay is for the animation of closing the dropdown
        // so the dropdown doesn't flash between "Loading..." and "No data"
        // before closing.
        setTimeout(() => {
          setIsLoading(false);
        }, 250);
      }
      // if no search input value, force sort options because it won't be sorted by
      // `filterSort`.
      if (isDropdownVisible && !inputValue && selectOptions.length > 1) {
        const sortedOptions = selectOptions
          .slice()
          .sort(sortComparatorForNoSearch);
        if (!isEqual(sortedOptions, selectOptions)) {
          setSelectOptions(sortedOptions);
        }
      }

      if (onDropdownVisibleChange) {
        onDropdownVisibleChange(isDropdownVisible);
      }
    };

    const dropdownRender = (
      originNode: ReactElement & { ref?: RefObject<HTMLElement> },
    ) => {
      return dropDownRenderHelper(
        originNode,
        isDropdownVisible,
        isLoading,
        fullSelectOptions.length,
        error ? <Error error={error} /> : undefined,
      );
    };

    const handleClear = () => {
      setSelectValue(undefined);
      if (onClear) {
        onClear();
      }
    };

    useEffect(() => {
      // when `options` list is updated from component prop, reset states
      fetchedQueries.current.clear();
      setAllValuesLoaded(false);
      setSelectOptions(initialOptions);
    }, [initialOptions]);

    useEffect(() => {
      setSelectValue(value);
    }, [value]);

    // Stop the invocation of the debounced function after unmounting
    useEffect(
      () => () => {
        debouncedFetchPage.cancel();
      },
      [debouncedFetchPage],
    );

    useEffect(() => {
      if (loadingEnabled && allowFetch) {
        // trigger fetch every time inputValue changes
        if (inputValue) {
          debouncedFetchPage(inputValue, 0);
        } else {
          fetchPage('', 0);
        }
      }
    }, [loadingEnabled, fetchPage, allowFetch, inputValue, debouncedFetchPage]);

    useEffect(() => {
      if (loading !== undefined && loading !== isLoading) {
        setIsLoading(loading);
      }
    }, [isLoading, loading]);

    const clearCache = () => fetchedQueries.current.clear();

    useImperativeHandle(
      ref,
      () => ({
        ...(ref.current as HTMLInputElement),
        clearCache,
      }),
      [ref],
    );

    useEffect(() => {
      setSelectValue(value);
    }, [value]);

    return (
      <StyledContainer>
        {header}
        <StyledSelect
          allowClear={!isLoading && allowClear}
          aria-label={ariaLabel || name}
          dropdownRender={dropdownRender}
          filterOption={handleFilterOption}
          filterSort={sortComparatorWithSearch}
          getPopupContainer={
            getPopupContainer || (triggerNode => triggerNode.parentNode)
          }
          labelInValue
          maxTagCount={MAX_TAG_COUNT}
          mode={mappedMode}
          notFoundContent={isLoading ? t('Loading...') : notFoundContent}
          onDeselect={handleOnDeselect}
          onDropdownVisibleChange={handleOnDropdownVisibleChange}
          onPopupScroll={handlePagination}
          onSearch={showSearch ? handleOnSearch : undefined}
          onSelect={handleOnSelect}
          onClear={handleClear}
          onChange={onChange}
          options={
            hasCustomLabels(fullSelectOptions) ? undefined : fullSelectOptions
          }
          placeholder={placeholder}
          showSearch={showSearch}
          showArrow
          tokenSeparators={tokenSeparators || TOKEN_SEPARATORS}
          value={selectValue}
          suffixIcon={getSuffixIcon(isLoading, showSearch, isDropdownVisible)}
          menuItemSelectedIcon={
            invertSelection ? (
              <StyledStopOutlined iconSize="m" />
            ) : (
              <StyledCheckOutlined iconSize="m" />
            )
          }
          ref={ref}
          {...props}
        >
          {hasCustomLabels(fullSelectOptions) &&
            renderSelectOptions(fullSelectOptions)}
        </StyledSelect>
      </StyledContainer>
    );
  },
);

export default AsyncSelect;
