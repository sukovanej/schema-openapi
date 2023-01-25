import * as OA from '../src';
import * as S from '@fp-ts/schema/Schema';
import express from 'express';

import swaggerUi from 'swagger-ui-express';

const app = express();
const spec = OA.openAPI(
  'My API',
  '1.0.0',
  OA.path('/pet', OA.operation('get', OA.tags('Pets'))),
  OA.path(
    '/pet',
    OA.operation(
      'post',
      OA.tags('Pets'),
      OA.jsonRequest(S.struct({ name: S.string, id: S.number }))
    )
  )
);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

app.listen(4000, () => console.log('listening'));
