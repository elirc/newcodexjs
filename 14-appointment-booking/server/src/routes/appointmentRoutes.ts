import type { RequestHandler } from "express";
import { Router } from "express";
import * as appointmentController from "../controllers/appointmentController.js";
import { validate } from "../middleware/validate.js";
import {
  appointmentIdParamsSchema,
  bookingBodySchema,
  cancelBodySchema,
  providerAppointmentsQuerySchema,
  rescheduleBodySchema,
} from "../validators/appointmentValidators.js";

export const appointmentRouter = Router();

appointmentRouter.post(
  "/appointments",
  validate({ body: bookingBodySchema }),
  wrap(appointmentController.bookAppointment),
);
appointmentRouter.get(
  "/my/appointments",
  wrap(appointmentController.listMyAppointments),
);
appointmentRouter.patch(
  "/appointments/:id/cancel",
  validate({ params: appointmentIdParamsSchema, body: cancelBodySchema }),
  wrap(appointmentController.cancelAppointment),
);
appointmentRouter.put(
  "/appointments/:id/reschedule",
  validate({ params: appointmentIdParamsSchema, body: rescheduleBodySchema }),
  wrap(appointmentController.rescheduleAppointment),
);
appointmentRouter.get(
  "/provider/appointments",
  validate({ query: providerAppointmentsQuerySchema }),
  wrap(appointmentController.listProviderAppointments),
);
appointmentRouter.patch(
  "/provider/appointments/:id/complete",
  validate({ params: appointmentIdParamsSchema }),
  wrap(appointmentController.completeAppointment),
);
appointmentRouter.patch(
  "/provider/appointments/:id/no-show",
  validate({ params: appointmentIdParamsSchema }),
  wrap(appointmentController.noShowAppointment),
);
appointmentRouter.patch(
  "/provider/appointments/:id/cancel",
  validate({ params: appointmentIdParamsSchema, body: cancelBodySchema }),
  wrap(appointmentController.providerCancelAppointment),
);
appointmentRouter.get(
  "/provider/dashboard",
  wrap(appointmentController.getProviderDashboard),
);

function wrap(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
