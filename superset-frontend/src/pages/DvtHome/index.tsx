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
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Moment } from 'moment';
import { openModal } from 'src/dvt-redux/dvt-modalReducer';
import withToasts from 'src/components/MessageToasts/withToasts';
import DvtCalendar from 'src/components/DvtCalendar';
import DvtButton from 'src/components/DvtButton';
import DvtTitleCardList, {
  CardDataProps,
} from 'src/components/DvtTitleCardList';
import {
  StyledDvtWelcome,
  DataContainer,
  CalendarContainer,
} from './dvt-home.module';

type ApiData = {
  result: any[];
};

type FormatFunction = (data: ApiData) => CardDataProps[];

const fetchAndFormatData = async (
  url: string,
  formatFunction: FormatFunction,
  setDataFunction: React.Dispatch<React.SetStateAction<CardDataProps[]>>,
) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    setDataFunction(formatFunction(data).sort((a, b) => a.id - b.id));
  } catch (error) {
    console.error('API request failed:', error);
  }
};

const formatDashboardData: FormatFunction = data =>
  data.result.slice(0, 5).map(item => ({
    id: item.id,
    title: item.dashboard_title,
    label: item.changed_by_name,
    description: `Modified ${item.changed_on_delta_humanized}`,
    isFavorite: item.published,
    link: item.url,
  }));

const formatChartData: FormatFunction = data =>
  data.result.slice(0, 5).map(item => ({
    id: item.id,
    title: item.slice_name,
    label: item.changed_by_name,
    description: `Modified ${item.created_on_delta_humanized}`,
    isFavorite: item.is_managed_externally,
    link: item.url,
  }));

const formatSavedQueriesData: FormatFunction = data =>
  data.result.slice(0, 5).map(item => ({
    id: item.id,
    title: item.label,
    label: item.description,
    description: `Ran ${item.last_run_delta_humanized}`,
    isFavorite: null,
    link: '',
  }));

const formatRecentData: FormatFunction = data =>
  data.result.slice(0, 5).map(item => ({
    id: Math.floor(item.time),
    title: item.item_title,
    label: '',
    description: `Modified ${item.time_delta_humanized}`,
    isFavorite: null,
    link: item.item_url,
  }));

function DvtWelcome() {
  const [openCalendar, setOpenCalendar] = useState<boolean>(true);
  const [calendar, setCalendar] = useState<Moment | null>(null);
  const [recentData, setRecentData] = useState<CardDataProps[]>([]);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [savedQueriesData, setSavedQueriesData] = useState<CardDataProps[]>([]);
  const dispatch = useDispatch();

  const handleSetFavorites = (
    id: number,
    isFavorite: boolean,
    title: string,
  ) => {
    const updateData = (dataList: CardDataProps[]) => {
      const findItem = dataList.find(item => item.id === id);
      const withoutItemData = dataList.filter(item => item.id !== id);
      return [
        ...withoutItemData,
        { ...findItem, isFavorite: !isFavorite },
      ].sort((a: CardDataProps, b: CardDataProps) => a.id - b.id);
    };

    fetch(
      `/superset/favstar/${title}/${id}/${isFavorite ? 'unselect' : 'select'}/`,
    ).then(res => {
      if (res.status === 200) {
        if (title === 'Dashboard') {
          setDashboardData(updatedData => updateData(updatedData));
        }
        if (title === 'slice') {
          setChartData(updatedData => updateData(updatedData));
        }
      }
    });
  };

  useEffect(() => {
    fetchAndFormatData('/api/v1/chart/', formatChartData, setChartData);
    fetchAndFormatData(
      '/api/v1/dashboard/',
      formatDashboardData,
      setDashboardData,
    );
    fetchAndFormatData(
      '/api/v1/saved_query/',
      formatSavedQueriesData,
      setSavedQueriesData,
    );
    fetchAndFormatData(
      '/api/v1/log/recent_activity/1/',
      formatRecentData,
      setRecentData,
    );
  }, []);

  const handleEditDashboard = async (id: number) => {
    try {
      const response = await fetch(`/api/v1/dashboard/${id}`);
      const editedDashboardData = await response.json();

      dispatch(
        openModal({
          component: 'edit-dashboard',
          meta: editedDashboardData,
        }),
      );
    } catch (error) {
      console.error('Failed to edit dashboard:', error);
    }
  };

  return (
    <StyledDvtWelcome>
      <DataContainer>
        <DvtTitleCardList title="Recents" data={recentData} />

        <DvtTitleCardList
          title="Dashboards"
          data={dashboardData}
          setFavorites={(id, isFavorite) =>
            handleSetFavorites(id, isFavorite, 'Dashboard')
          }
          dropdown={[
            {
              label: 'Edit',
              icon: 'edit_alt',
              onClick: (id: number) => {
                handleEditDashboard(id);
              },
            },
            { label: 'Export', icon: 'share', onClick: () => {} },
            { label: 'Delete', icon: 'trash', onClick: () => {} },
          ]}
        />

        <DvtTitleCardList
          title="Charts"
          data={chartData}
          setFavorites={(id, isFavorite) =>
            handleSetFavorites(id, isFavorite, 'slice')
          }
          dropdown={[
            { label: 'Edit', icon: 'edit_alt', onClick: () => {} },
            { label: 'Export', icon: 'share', onClick: () => {} },
            { label: 'Delete', icon: 'trash', onClick: () => {} },
          ]}
        />

        <DvtTitleCardList
          title="Saved Queries"
          data={savedQueriesData}
          dropdown={[{ label: 'Share', onClick: () => {} }]}
        />
      </DataContainer>
      <CalendarContainer>
        {openCalendar ? (
          <DvtCalendar
            isOpen={openCalendar}
            setIsOpen={setOpenCalendar}
            selectedDate={calendar}
            setSelectedDate={date => date && setCalendar(date)}
          />
        ) : (
          <DvtButton
            label="Open Calendar"
            onClick={() => setOpenCalendar(true)}
          />
        )}
      </CalendarContainer>
    </StyledDvtWelcome>
  );
}

export default withToasts(DvtWelcome);
