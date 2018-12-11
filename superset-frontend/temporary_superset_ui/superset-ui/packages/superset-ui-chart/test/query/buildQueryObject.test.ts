import { buildQueryObject, QueryObject } from '../../src/query/buildQueryObject';

describe('queryObjectBuilder', () => {
  let query: QueryObject;

  it('should build granularity for sql alchemy datasources', () => {
    query = buildQueryObject({ datasource: '5__table', granularity_sqla: 'ds' });
    expect(query.granularity).toEqual('ds');
  });

  it('should build granularity for sql druid datasources', () => {
    query = buildQueryObject({ datasource: '5__druid', granularity: 'ds' });
    expect(query.granularity).toEqual('ds');
  });

  it('should build metrics', () => {
    query = buildQueryObject({
      datasource: '5__table',
      granularity_sqla: 'ds',
      metric: 'sum__num',
    });
    expect(query.metrics).toEqual([{ label: 'sum__num' }]);
  });
});
