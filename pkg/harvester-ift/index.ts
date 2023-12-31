import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import harvesterRoutes from './routing/harvester-routing';
import harvesterCommonStore from './store/harvester-common';
import harvesterStore from './store/harvester-store';
import customValidators from './validators';

// Init the package
export default function(plugin: IPlugin): void {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./config/harvester'));

  // Add routes
  plugin.addRoutes(harvesterRoutes);

  plugin.addDashboardStore(harvesterCommonStore.config.namespace, harvesterCommonStore.specifics, harvesterCommonStore.config);
  plugin.addDashboardStore(harvesterStore.config.namespace, harvesterStore.specifics, harvesterStore.config, harvesterStore.init);

  plugin.validators = customValidators;
}
