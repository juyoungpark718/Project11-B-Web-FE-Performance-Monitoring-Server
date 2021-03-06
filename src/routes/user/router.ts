import Router from 'koa-router';

import controllers from './controllers';

export default async (): Promise<Record<string, unknown>> => {
  const router = new Router();
  const controller: any = await controllers();

  // get
  router.get('/user/:id', controller.getUser);

  // patch
  router.patch('/user/email', controller.updateEmail);

  return router;
};
