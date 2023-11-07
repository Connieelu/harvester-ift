<script>
import { HCI, PRODUCT_NAME } from '../types';
import ResourceTable from '@shell/components/ResourceTable';

import { allHash } from '@shell/utils/promise';
import Loading from '@shell/components/Loading';

import {
  STATE,
  NAME,
  AGE,
  NAMESPACE
} from '@shell/config/table-headers';
import { FINGERPRINT } from '../config/table-headers';

export default {
  name:       'HarvesterListKeyPair',
  components: {
    Loading,
    ResourceTable
  },

  async fetch() {
    const _hash = { key: this.$store.dispatch(`${ PRODUCT_NAME }/findAll`, { type: HCI.SSH }) };
    const hash = await allHash(_hash);

    this.allKeyPair = hash.key;
  },

  data() {
    return {
      allKeyPair: [],
      schema:     this.$store.getters[`${ PRODUCT_NAME }/schemaFor`](HCI.SSH),
    };
  },
  computed: {
    headers() {
      return [
        STATE,
        {
          ...NAME,
          width: 300,
        },
        NAMESPACE, FINGERPRINT,
        {
          ...AGE,
          sort: 'metadata.creationTimestamp:desc',
        }
      ];
    },
    rows() {
      return this.allKeyPair;
    },
  },
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <ResourceTable
      v-bind="$attrs"
      :headers="headers"
      default-sort-by="age"
      :rows="rows"
      :schema="schema"
      :groupable="true"
      key-field="_key"
      v-on="$listeners"
    />
  </div>
</template>

<style lang="scss" scoped>

</style>
