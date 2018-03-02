
<template>
  <Card>
    <Row :gutter="24">
      <i-col span="12">
        <Form :label-width="120" label-position="left">
          <FormItem label="t_stop [ms]">
            <InputNumber
              size="small"
              placeholder="Enter something..."
            ></InputNumber>
          </FormItem>
        </Form>
      </i-col>
      <i-col span="12">
        <Form :label-width="120" label-position="left">
          <FormItem label="time step [ms]">
            <InputNumber
              size="small"
              placeholder="Enter something..."
            ></InputNumber>
          </FormItem>
        </Form>
      </i-col>
    </Row>
  </Card>
</template>


<script>
  export default {
    name: 'global-config',
    data() {
      return {};
    },
  }
</script>


<style lang="scss" scoped>
  .ivu-form-item {
    margin-bottom: 2px;
  }

  .ivu-input-number {
    width: 100%;
  }

  .ivu-card {
    margin-bottom: 12px;
  }
</style>
