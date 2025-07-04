import { emailRenderer } from './consolidated/email-renderer';
import { deliveryManager } from './consolidated/delivery-manager';
import { qualityController } from './consolidated/quality-controller';

/**
 * Deprecation shims — thin wrappers that map legacy tool names to the new consolidated tool entry-points.
 * They are TEMPORARY and will be removed once all references are updated.
 */

export async function render_mjml(params: any) {
  return emailRenderer({ ...params, action: 'render_mjml' });
}

export async function render_component(params: any) {
  return emailRenderer({ ...params, action: 'render_component' });
}

export async function advanced_component_system(params: any) {
  return emailRenderer({ ...params, action: 'render_advanced' });
}

export async function seasonal_component_system(params: any) {
  return emailRenderer({ ...params, action: 'render_seasonal' });
}

export async function upload_s3(params: any) {
  return deliveryManager({ ...params, action: 'upload_assets' });
}

export async function percy_snap(params: any) {
  return deliveryManager({ ...params, action: 'visual_testing' });
}

export async function diff_html(params: any) {
  return qualityController({ ...params, action: 'diff_html' });
}

export async function patch_html(params: any) {
  return qualityController({ ...params, action: 'patch_html' });
}

export async function render_test(params: any) {
  return qualityController({ ...params, action: 'render_test' });
} 