import app from "./create-app";
// import { handleVerificationRequestQueueBatch } from "./infra/events/queue-handler";

// export { NotificationDO } from "./notification/notification-do";

export default {
  fetch: app.fetch,
//   queue: handleVerificationRequestQueueBatch,
};
