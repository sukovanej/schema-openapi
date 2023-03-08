import * as OA from '../src';
import * as S from '@fp-ts/schema/Schema';
import express from 'express';

import swaggerUi from 'swagger-ui-express';

const petSchema = S.struct({
  name: S.string,
  id: S.number,
});

const app = express();
const spec = OA.openAPI(
  'My awesome pets API',
  '1.0.0',
  OA.path(
    '/pet',
    OA.operation(
      'get',
      OA.tags('Pets'),
      OA.jsonResponse(200, petSchema, 'Pet response')
    ),
    OA.operation('post', OA.tags('Pets'), OA.jsonRequest(petSchema)),
    OA.operation('put', OA.tags('Pets'), OA.jsonRequest(petSchema))
  )
);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

app.listen(4000, () => console.log('listening'));
