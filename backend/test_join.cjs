const { SessionService } = require('./src/services/session.service.js');
const sessionService = new SessionService();
sessionService.joinByCode('C377A1')
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit(0));
