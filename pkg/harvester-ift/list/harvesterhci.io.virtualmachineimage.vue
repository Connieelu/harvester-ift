<script>
import ResourceTable, { defaultTableSortGenerationFn } from '@shell/components/ResourceTable';
import { Banner } from '@components/Banner';
import FilterLabel from '../components/FilterLabel';

import { allHash } from '@shell/utils/promise';
import { HCI, PRODUCT_NAME } from '../types';

export default {
  name: 'ListHarvesterImage',

  components: {
    ResourceTable,
    Banner,
    FilterLabel
  },
  async fetch() {
    const _hash = { image: this.$store.dispatch(`${ PRODUCT_NAME }/findAll`, { type: HCI.IMAGE }) };
    const hash = await allHash(_hash);

    this.allImages = hash.image;
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    },
    rows: {
      type:     Array,
      required: true,
    },
  },

  data() {
    return {
      searchLabels: [],
      filterRows:   [],
      allImages:    [],
    };
  },

  computed: {
    uploadingImages() {
      return this.$store.getters['cluster-common/uploadingImages'] || [];
    },
  },

  methods: {
    changeRows(filterRows, searchLabels) {
      this.$set(this, 'filterRows', filterRows);
      this.$set(this, 'searchLabels', searchLabels);
    },

    sortGenerationFn() {
      let base = defaultTableSortGenerationFn(this.schema, this.$store);

      this.searchLabels.map((label) => {
        base += label.key;
        base += label.value;
      });

      return base;
    },
  }
};
</script>

<template>
  <div>
    <Banner
      v-if="uploadingImages.length > 0"
      color="warning"
      :label="t('harvester.image.warning.uploading', {count: uploadingImages.length} )"
    />
    <ResourceTable
      v-bind="$attrs"
      :rows="allImages"
      :schema="schema"
      :sort-generation-fn="sortGenerationFn"
      key-field="_key"
      v-on="$listeners"
    >
      <template #more-header-middle>
        <FilterLabel
          ref="filterLabel"
          :rows="rows"
          @changeRows="changeRows"
        />
      </template>
    </ResourceTable>
  </div>
</template>
