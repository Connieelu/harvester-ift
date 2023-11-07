<script>
import { mapGetters } from 'vuex';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import AsyncButton from '@shell/components/AsyncButton';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { HCI as HCI_ANNOTATIONS } from '@pkg/harvester-ift/config/labels-annotations';

export default {
  name:       'HarvesterPvcCloneDialog',
  components: {
    AsyncButton, Banner, Card, LabeledInput, Checkbox
  },
  props: {
    resources: {
      type:     Array,
      required: true
    }
  },
  data() {
    return {
      name:            '',
      cloneData:       true,
      errors:          [],
      alertMsgEnabled: false,
      pvcName:         '',
    };
  },

  created() {
    //  get the pvc name
    this.pvcName = this.resources[0].metadata.name;
    // get the status
    const pvcOccupation = this.resources[0].metadata.annotations?.[HCI_ANNOTATIONS.VOLUME_CLONE_INFO] ? JSON.parse(this.resources[0].metadata.annotations?.[HCI_ANNOTATIONS.VOLUME_CLONE_INFO]) : '';

    this.alertMsgEnabled = pvcOccupation?.ifoccupied === 'True';
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    actionResource() {
      return this.resources[0];
    },
    disableSave() {
      return this.cloneData && !this.name;
    }
  },
  methods: {
    close() {
      this.name = '';
      this.$emit('close');
    },
    async save(buttonCb) {
      if (!this.cloneData) {
        this.resources[0].goToClone();
        buttonCb(false);
        this.close();

        return;
      }

      try {
        const cloneMode = { mode: 'cdi', name: this.name };

        this.resources[0].metadata.annotations[HCI_ANNOTATIONS.VOLUME_CLAIM_CLONE_MODE] = JSON.stringify(cloneMode);
        this.resources[0].save();
        const res = await this.actionResource.doAction('clone', { name: this.name });

        if (res._status === 200 || res._status === 204) {
          this.$store.dispatch('growl/success', {
            title:   this.t('harvester.notification.title.succeed'),
            message: this.t('harvester.modal.volumeClone.message.success', { name: this.name })
          }, { root: true });
          this.close();
          buttonCb(true);
        } else {
          const error = [res?.data] || exceptionToErrorsArray(res);

          this.$set(this, 'errors', error);
          buttonCb(false);
        }
      } catch (err) {
        const error = err?.data || err;
        const message = exceptionToErrorsArray(error);

        this.$set(this, 'errors', message);
        buttonCb(false);
      }
    }
  },
};
</script>
<template>
  <Card :show-highlight-border="false">
    <template #title>
      {{ t('harvester.modal.volumeClone.title') }}
    </template>
    <template #body>
      <Checkbox
        v-model="cloneData"
        class="mb-10"
        label-key="harvester.modal.cloneVM.type"
        :disabled="alertMsgEnabled"
      />

      <LabeledInput
        v-show="cloneData"
        v-model="name"
        class="mb-20"
        :label="t('harvester.modal.volumeClone.name')"
        required
        :disabled="alertMsgEnabled"
      />
      <div
        v-if="alertMsgEnabled"
        class="errorMsg"
      >
        {{ t('harvester.modal.volumeClone.message.error',{name: pvcName}) }}
      </div>
    </template>
    <div
      slot="actions"
      class="actions"
    >
      <div class="buttons">
        <button
          class="btn role-secondary mr-10"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton
          mode="create"
          :disabled="disableSave || alertMsgEnabled"
          @click="save"
        />
      </div>
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :label="err"
      />
    </div>
  </Card>
</template>
<style lang="scss" scoped>
.actions {
  width: 100%;
}
.buttons {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
.errorMsg {
  color: var(--error) !important;
}
</style>
