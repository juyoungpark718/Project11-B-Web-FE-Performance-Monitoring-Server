import { Context } from 'koa';
import Project from '../../../models/Project';
import User from '../../../models/User';
import swapOwner from '../service/ownserService';

interface IParams {
  id: string;
}

interface IBody {
  originUserId: string;
  targetUserId: string;
}

export default async (ctx: Context): Promise<void> => {
  const { id: projectId }: IParams = ctx.params;
  const { originUserId, targetUserId }: IBody = ctx.request.body;
  try {
    if (ctx.state.user._id !== originUserId) {
      throw Error();
    }
    const targetUserCount = await User.countDocuments({ _id: targetUserId });
    const projectOwnerCount = await Project.countDocuments({ _id: projectId, owner: originUserId });
    if (targetUserCount !== 1 || projectOwnerCount !== 1) {
      throw Error();
    }
    await swapOwner({ projectId, originUserId, targetUserId });
    ctx.status = 200;
  } catch (e) {
    ctx.throw(400);
  }
};
