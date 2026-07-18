import { Router } from "express";
import * as appointmentController from "../controllers/appointmentController";
import { validate } from "../middleware/validate";
import {
  appointmentIdParamsSchema,
  bookingBodySchema,
  cancelBodySchema,
  providerAppointmentsQuerySchema,
  rescheduleBodySchema
} from "../validators/appointmentValidators";

export const appointmentRouter = Router();

appointmentRouter.post("/appointments", validate({ body: bookingBodySchema }), appointmentController.bookAppointment);
appointmentRouter.get("/my/appointments", appointmentController.listMyAppointments);
appointmentRouter.patch("/appointments/:id/cancel", validate({ params: appointmentIdParamsSchema, body: cancelBodySchema }), appointmentController.cancelAppointment);
appointmentRouter.put("/appointments/:id/reschedule", validate({ params: appointmentIdParamsSchema, body: rescheduleBodySchema }), appointmentController.rescheduleAppointment);
appointmentRouter.get("/provider/appointments", validate({ query: providerAppointmentsQuerySchema }), appointmentController.listProviderAppointments);
appointmentRouter.patch("/provider/appointments/:id/complete", validate({ params: appointmentIdParamsSchema }), appointmentController.completeAppointment);
appointmentRouter.patch("/provider/appointments/:id/no-show", validate({ params: appointmentIdParamsSchema }), appointmentController.noShowAppointment);
appointmentRouter.patch("/provider/appointments/:id/cancel", validate({ params: appointmentIdParamsSchema, body: cancelBodySchema }), appointmentController.providerCancelAppointment);
appointmentRouter.get("/provider/dashboard", appointmentController.getProviderDashboard);
