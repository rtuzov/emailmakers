import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { ContentToDesignSchema, DesignToQualitySchema, QualityToDeliverySchema } from '../src/agent/types/handoff-schemas';
import fs from 'fs';
import path from 'path';

const registry = new OpenAPIRegistry();

registry.register('ContentToDesign', ContentToDesignSchema);
registry.register('DesignToQuality', DesignToQualitySchema);
registry.register('QualityToDelivery', QualityToDeliverySchema);

const generator = new OpenApiGeneratorV31(registry.definitions);
const document = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    version: '1.0.0',
    title: 'Email Makers Hand-off Schemas',
    description: 'Auto-generated OpenAPI definitions from Zod schemas',
  },
});

const outputDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
fs.writeFileSync(path.join(outputDir, 'handoff-schemas.openapi.json'), JSON.stringify(document, null, 2));
console.log('✅ OpenAPI docs generated at docs/handoff-schemas.openapi.json'); 