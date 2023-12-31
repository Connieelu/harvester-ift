<script>
import Footer from '@shell/components/form/Footer';
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import CreateEditView from '@shell/mixins/create-edit-view';
import { allHash } from '@shell/utils/promise';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { NAMESPACE } from '@shell/config/types';
import { HCI, PRODUCT_NAME } from '../types';
import { sortBy } from '@shell/utils/sort';
import { clone } from '@shell/utils/object';

const createObject = {
  apiVersion: 'snapshot.kubevirt.io/v1alpha1',
  kind:       'VirtualMachineRestore',
  metadata:   { name: '', namespace: '' },
  type:       HCI.RESTORE,
  spec:       {
    target: {
      apiGroup: 'kubevirt.io',
      kind:     'VirtualMachine',
      name:     ''
    },
    virtualMachineSnapshotName: '',
    newVM:                      true,
    deletionPolicy:             'retain'
  }
};

export default {
  name:       'CreateRestore',
  components: {
    Footer,
    RadioGroup,
    LabeledInput,
    LabeledSelect,
  },

  mixins: [CreateEditView],

  async fetch() {
    await allHash({
      backups: this.$store.dispatch(`cluster/findAll`, { type: HCI.VM_SNAPSHOT }),
      vms:     this.$store.dispatch(`${ PRODUCT_NAME }/findAll`, { type: HCI.VM }),
    });
  },

  data() {
    const restoreMode = this.$route.query?.restoreMode;
    const snapshotName = this.$route.query?.resourceName;

    const restoreResource = clone(createObject);

    const restoreNewVm = restoreMode === 'new' || restoreMode === undefined;

    return {
      snapshotName,
      restoreNewVm,
      restoreResource,
      name:           '',
      description:    '',
      deletionPolicy: 'retain',
      namespace:      ''
    };
  },

  computed: {
    snapshotOption() {
      const choices = this.$store.getters[`cluster/all`](HCI.VM_SNAPSHOT);

      return choices.filter( (T) => {
        const hasVM = this.restoreNewVm || T.attachVmExisting;

        // return hasVM && T?.status?.readyToUse && T.spec?.type === 'snapshot';
        return hasVM && T?.status?.readyToUse;
      }).map( (T) => {
        return {
          label: T.metadata.name,
          value: T.metadata.name
        };
      });
    },

    deletionPolicyOption() {
      return [{
        value: 'retain',
        label: 'Retain'
      }];
    },

    currentBackupResource() {
      const name = this.snapshotName;

      const backupList = this.$store.getters[`cluster/all`](HCI.VM_SNAPSHOT);

      return backupList.find( (O) => O.name === name);
    },

    disableExisting() {
      return !this.currentBackupResource?.attachVmExisting;
    },

    snapshotNamespace() {
      const backupList = this.$store.getters[`cluster/all`](HCI.VM_SNAPSHOT);

      return backupList.find( (B) => B.metadata.name === this.snapshotName)?.metadata?.namespace;
    },

    namespaces() {
    //   const inStore = this.$store.getters['currentStore'](NAMESPACE);
      const choices = this.$store.getters[`cluster/all`](NAMESPACE);
      const systemNamespaces = this.$store.getters['systemNamespaces'];

      const out = sortBy(
        choices.filter((N) => !systemNamespaces.includes(N.metadata.name)).map((obj) => {
          return {
            label: obj.nameDisplay,
            value: obj.id,
          };
        }),
        'label'
      );

      return out;
    },
  },

  watch: {
    snapshotName: {
      handler(neu) {
        if (this.currentBackupResource) {
          if (!this.restoreNewVm) {
            this.name = this?.currentBackupResource?.attachVM;
          }
        }

        this.restoreResource.spec.virtualMachineSnapshotName = neu;
      },
      immediate: true
    },

    restoreNewVm(neu) {
      if (neu) {
        this.name = '';
      } else {
        this.name = this?.currentBackupResource?.attachVM;
      }
    },

    snapshotNamespace: {
      handler(neu) {
        this.namespace = neu;
      },
      immediate: true
    }
  },

  methods: {
    async saveRestore(buttonCb) {
      this.update();

      const proxyResource = await this.$store.dispatch(`cluster/create`, this.restoreResource);

      proxyResource.metadata.namespace = this.namespace;
      // proxyResource.spec.virtualMachineBackupNamespace = this.snapshotNamespace;
      try {
        await proxyResource.save();
        buttonCb(true);

        this.$router.push({
          name:   this.doneRoute,
          params: { resource: HCI.VM }
        });
      } catch (err) {
        this.errors = exceptionToErrorsArray(err) || err;
        buttonCb(false);
      }
    },

    update() {
      this.restoreResource.metadata.generateName = `restore-${ this.snapshotName }-`;
      if (this.name) {
        this.restoreResource.spec.target.name = this.name;
      }

      if (this.restoreNewVm) {
        delete this.restoreResource.spec.deletionPolicy;
        this.restoreResource.spec.newVM = true;
      } else {
        this.restoreResource.spec.deletionPolicy = this.deletionPolicy;
        delete this.restoreResource.spec.newVM;
      }
    }
  },

  componentTitle() {
    return 'restoreVM';
  }
};
</script>

<template>
  <div id="restore">
    <div class="content">
      <div class="mb-20">
        <RadioGroup
          v-model="restoreNewVm"
          name="model"
          :options="[true,false]"
          :labels="[t('harvester.backup.restore.createNew'), t('harvester.backup.restore.replaceExisting')]"
          :disabled="disableExisting"
          :mode="mode"
        />
      </div>

      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model="namespace"
            :disabled="true"
            :label="t('nameNsDescription.namespace.label')"
            :options="namespaces"
          />
        </div>

        <div class="col span-6">
          <LabeledInput
            v-model="name"
            :disabled="!restoreNewVm"
            :label="t('harvester.backup.restore.virtualMachineName')"
            :placeholder="t('nameNsDescription.name.placeholder')"
            class="mb-20"
          />
        </div>
      </div>

      <LabeledSelect
        v-model="snapshotName"
        class="mb-20"
        :label="t('harvester.vmSnapshot.snapshot')"
        :options="snapshotOption"
      />

      <LabeledSelect
        v-if="!restoreNewVm"
        v-model="deletionPolicy"
        :label="t('harvester.backup.restore.deletePreviousVolumes')"
        :options="deletionPolicyOption"
      />
    </div>

    <Footer
      mode="create"
      class="footer"
      :errors="errors"
      @save="saveRestore"
      @done="done"
    />
  </div>
</template>

<style lang="scss" scoped>
#restore {
  display: flex;
  flex-grow: 1;
  flex-direction: column;

  ::v-deep .radio-group {
    display: flex;
    .radio-container {
      margin-right: 30px;
    }
  }

  .content {
    flex-grow: 1
  }

  .footer {
    border-top: var(--header-border-size) solid var(--header-border);

    // Overrides outlet padding
    margin-left: -$space-m;
    margin-right: -$space-m;
    margin-bottom: -$space-m;
    padding: $space-s $space-m;

    ::v-deep .spacer-small {
      padding: 0px;
    }
  }
}
</style>
