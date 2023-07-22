import express from 'express';
import swaggerUi from 'swagger-ui-express';

import * as S from '@effect/schema/Schema';

import * as OpenApi from '../src';

const Pet = S.struct({
  name: S.string,
  id: S.number,
});

const UsageId = S.description('Usage identifier')(S.string);

const app = express();
const spec = OpenApi.openAPI(
  'My awesome pets API',
  '1.0.0',
  OpenApi.path(
    '/pet',
    OpenApi.operation(
      'get',
      OpenApi.tags('Pets'),
      OpenApi.jsonResponse(
        200,
        Pet,
        'Pet response',
        OpenApi.responseHeaders({ 'Usage-Id': UsageId })
      ),
      OpenApi.operationId('getPet')
    ),
    OpenApi.operation(
      'post',
      OpenApi.tags('Pets'),
      OpenApi.jsonRequest(Pet),
      OpenApi.operationId('savePet')
    ),
    OpenApi.operation(
      'put',
      OpenApi.tags('Pets'),
      OpenApi.jsonRequest(Pet),
      OpenApi.operationId('replacePet')
    )
  )
);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

app.listen(4000, () => console.log('listening'));
