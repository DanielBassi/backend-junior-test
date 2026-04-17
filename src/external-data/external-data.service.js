const axios = require("axios");
const { AppError } = require("../common/errors/app-error");

const EXTERNAL_USERS_API = process.env.EXTERNAL_API_URL || "https://jsonplaceholder.typicode.com/users";

class ExternalDataService {
  constructor(externalItemRepository) {
    this.externalItemRepository = externalItemRepository;
  }

  async getTransformedExternalData() {
    try {
      const response = await axios.get(EXTERNAL_USERS_API, { timeout: 5000 });
      const transformedUsers = response.data.map((user) => ({
        externalId: user.id,
        name: user.name,
        email: user.email,
        company: user.company?.name || "Unknown",
      }));

      try {
        await this.externalItemRepository.upsert(transformedUsers, ["externalId"]);

        const storedItems = await this.externalItemRepository.find({
          order: { externalId: "ASC" },
        });

        return storedItems.map((item) => ({
          id: item.externalId,
          name: item.name,
          email: item.email,
          company: item.company,
        }));
      } catch (_persistError) {
        return transformedUsers.map((item) => ({
          id: item.externalId,
          name: item.name,
          email: item.email,
          company: item.company,
        }));
      }
    } catch (error) {
      throw new AppError(`Failed to consume external API: ${error.message}`, 502);
    }
  }
}

module.exports = { ExternalDataService };
