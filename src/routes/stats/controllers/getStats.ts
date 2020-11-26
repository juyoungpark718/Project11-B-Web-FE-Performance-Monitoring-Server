import { Context, Next } from 'koa';
import Issue, { IssueTypeModel } from '../../../models/Issue';
import { getPeriodByMillisec, getDefaultInterval } from '../services/statUtil';

interface Recent {
  type: string;
  period: string;
  interval: string;
}

interface Manual extends Recent {
  start: string;
  end: string;
}

export default async (ctx: Context, next: Next) => {
  const params: Recent | Manual = ctx.query;

  const period: number = getPeriodByMillisec(params.period);
  const interval: number = getDefaultInterval(params.period, params.interval);
  const start: Date = new Date(Date.now() - period); // 현재 - 구할 시간

  const result: IssueTypeModel[] = await Issue.aggregate([
    // 1. 지금 시간부터 period를 뺀 시간까지의 데이터의 occuredAt을 추출한다.
    { $match: { occuredAt: { $gte: start, $lte: new Date() } } },
    // 2. (occuredAt - 시간 기본값) - ((occuredAt - 시간 기본값) % interval)으로 시간을 나누어 그룹핑해주고, 그룹마다 count에 1을 더해준다.
    // mod기 때문에 나머지 초가 없어진다.
    {
      $group: {
        _id: {
          $subtract: [
            { $subtract: ['$occuredAt', new Date('1970-01-01')] },
            { $mod: [{ $subtract: ['$occuredAt', new Date('1970-01-01')] }, interval] },
          ],
        },
        count: {
          $sum: 1,
        },
      },
    },
    // 3. _id에 저장되어있던 occuredAt의 시간을 date 객체 형태로 추출해준다.
    // 기존의 id를 제거하기 위해 _id:0을 해준다. (원리는 모르겠음)
    {
      $project: {
        occuredAt: { $convert: { input: '$_id', to: 'date' } },
        count: '$count',
        _id: 0,
      },
    },
    // 4. 오름차순으로 정렬해준다.
    {
      $sort: {
        occuredAt: 1,
      },
    },
  ]);
  ctx.body = result;

  await next();
};