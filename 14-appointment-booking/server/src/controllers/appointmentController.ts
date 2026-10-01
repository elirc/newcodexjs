import type { Request, Response } from "express";
import type { AppointmentFilters } from "../models/appointmentModel.js";
import * as appointmentService from "../services/appointmentService.js";
import { sendSuccess } from "../utils/response.js";

/** Handles customer booking creation. */
export async function bookAppointment(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await appointmentService.bookAppointment(req.user!.id, req.body),
    201,
  );
}

/** Handles customer appointment dashboard data. */
export async function listMyAppointments(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(res, await appointmentService.listMyAppointments(req.user!.id));
}

/** Handles customer cancellation with policy enforcement. */
export async function cancelAppointment(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await appointmentService.cancelCustomerAppointment(
      req.user!.id,
      Number(String(req.params.id)),
      req.body.reason,
    ),
  );
}

/** Handles customer rescheduling. */
export async function rescheduleAppointment(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await appointmentService.rescheduleAppointment(
      req.user!.id,
      Number(String(req.params.id)),
      req.body.startTime,
    ),
  );
}

/** Handles provider appointment listing. */
export async function listProviderAppointments(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await appointmentService.listProviderAppointments(
      req.user!.id,
      req.query as AppointmentFilters,
    ),
  );
}

/** Handles provider marking an appointment completed. */
export async function completeAppointment(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await appointmentService.updateProviderAppointmentStatus(
      req.user!.id,
      Number(String(req.params.id)),
      "completed",
    ),
  );
}

/** Handles provider marking an appointment no-show. */
export async function noShowAppointment(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await appointmentService.updateProviderAppointmentStatus(
      req.user!.id,
      Number(String(req.params.id)),
      "no_show",
    ),
  );
}

/** Handles provider cancellation. */
export async function providerCancelAppointment(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(
    res,
    await appointmentService.updateProviderAppointmentStatus(
      req.user!.id,
      Number(String(req.params.id)),
      "cancelled_by_provider",
      req.body.reason,
    ),
  );
}

/** Handles provider dashboard summary data. */
export async function getProviderDashboard(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(res, await appointmentService.getProviderDashboard(req.user!.id));
}
