const { EntitySchema } = require("typeorm");

const UserSchema = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    username: {
      type: String,
      nullable: false,
      unique: true,
    },
    password: {
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

module.exports = { UserSchema };
