const { EntitySchema } = require("typeorm");

const ExternalItemSchema = new EntitySchema({
  name: "ExternalItem",
  tableName: "external_items",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    externalId: {
      type: Number,
      nullable: false,
      unique: true,
    },
    name: {
      type: String,
      nullable: false,
    },
    email: {
      type: String,
      nullable: false,
    },
    company: {
      type: String,
      nullable: false,
    },
    createdAt: {
      type: "datetime",
      createDate: true,
    },
    updatedAt: {
      type: "datetime",
      updateDate: true,
    },
  },
});

module.exports = { ExternalItemSchema };
