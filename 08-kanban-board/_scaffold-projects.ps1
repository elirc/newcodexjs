$ErrorActionPreference = "Stop"

function Write-ProjectFile {
  param([string]$Path, [string]$Content)
  $dir = Split-Path -Parent $Path
  if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  Set-Content -LiteralPath $Path -Value $Content -NoNewline -Encoding UTF8
}

$kanbanRoot = "08-kanban-board"
$jobRoot = "09-job-application-tracker"
$inventoryRoot = "10-inventory-management"

Write-ProjectFile "$kanbanRoot/.env.example" @'
NODE_ENV=development
PORT=4108
CLIENT_ORIGIN=http://localhost:5178
DATABASE_URL=postgres://postgres:postgres@localhost:5432/kanban_board
DEMO_USER_ID=1
'@

Write-ProjectFile "$kanbanRoot/README.md" @'
# Project 8: Kanban Board

A Trello-lite learning app with React 18, Vite, TypeScript, Express, PostgreSQL, Knex, Zod, React Query, CSS Modules, dnd-kit wiring, fractional positions, optimistic UI concepts, checklists, labels, sharing, and activity logs.

## Run locally

1. `cd 08-kanban-board/server && npm install`
2. Copy `../.env.example` to `../.env` and update `DATABASE_URL`.
3. `npm run migrate && npm run seed && npm run dev`
4. `cd ../client && npm install && npm run dev`

The API returns `{ success, data }` or `{ success: false, error }`. The demo assumes user `1` instead of implementing auth so the board logic stays visible.
'@

Write-ProjectFile "$kanbanRoot/docs/architecture.md" @'
# Architecture

## Backend

Controllers are thin request adapters. Services own business decisions such as fractional positions, share token creation, and activity logging. Models contain Knex queries only. Central error middleware formats every failure with the standard response envelope.

## Frontend

The board page uses React Query for server state and keeps a small optimistic overlay while drag-and-drop operations are in flight. dnd-kit imports are wired in `BoardPage.tsx`; the sortable callback delegates the final persisted position to the API.

## Data model

`boards -> lists -> cards` is loaded as a nested aggregate. Labels and checklists are separate tables so the card detail modal can evolve without changing the compact board query. Fractional positions start at 1024 increments and are recalculated only when positions get too close.
'@

Write-ProjectFile "$kanbanRoot/server/package.json" @'
{
  "name": "08-kanban-board-server",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "migrate": "knex --knexfile knexfile.ts migrate:latest",
    "rollback": "knex --knexfile knexfile.ts migrate:rollback",
    "seed": "knex --knexfile knexfile.ts seed:run"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "helmet": "^8.0.0",
    "knex": "^3.1.0",
    "morgan": "^1.10.0",
    "pg": "^8.13.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/morgan": "^1.9.9",
    "@types/node": "^22.10.2",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
'@

Write-ProjectFile "$kanbanRoot/server/tsconfig.json" @'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["src", "db", "knexfile.ts"]
}
'@

Write-ProjectFile "$kanbanRoot/server/knexfile.ts" @'
import "dotenv/config";
import type { Knex } from "knex";

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: { directory: "./db/migrations", extension: "ts" },
    seeds: { directory: "./db/seeds", extension: "ts" }
  }
};

export default config;
'@

Write-ProjectFile "$kanbanRoot/server/src/config/env.ts" @'
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4108),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5178"),
  DATABASE_URL: z.string().min(1),
  DEMO_USER_ID: z.coerce.number().int().positive().default(1)
});

/** Validates process environment once so startup fails before handling traffic. */
export function loadEnv() {
  return envSchema.parse(process.env);
}

export const env = loadEnv();
'@

Write-ProjectFile "$kanbanRoot/server/src/config/db.ts" @'
import knex from "knex";
import config from "../../knexfile.js";
import { env } from "./env.js";

/** Shared Knex connection configured for the current Node environment. */
export const db = knex(config[env.NODE_ENV]);
'@

Write-ProjectFile "$kanbanRoot/server/src/types/index.ts" @'
export interface BoardInput { name: string; background?: string }
export interface ListInput { name: string; position?: number }
export interface CardInput { title: string; description?: string | null; dueDate?: string | null; position?: number }
export interface MoveCardInput { listId: number; position: number }
export interface LabelInput { name?: string | null; color: string }
export interface ChecklistInput { title?: string; position?: number }
export interface ChecklistItemInput { content: string; isChecked?: boolean; position?: number }
'@

Write-ProjectFile "$kanbanRoot/server/src/utils/errors.ts" @'
/** Base operational error with an HTTP status and machine-readable code. */
export class AppError extends Error {
  constructor(message: string, public statusCode = 500, public code = "APP_ERROR") {
    super(message);
  }
}

/** Error used when a requested record cannot be found. */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

/** Error used for invalid user input after request validation. */
export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, 400, "VALIDATION_ERROR");
  }
}
'@

Write-ProjectFile "$kanbanRoot/server/src/utils/response.ts" @'
import type { Response } from "express";

/** Sends a successful API response using the shared envelope shape. */
export function sendSuccess<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}
'@

Write-ProjectFile "$kanbanRoot/server/src/middleware/errorMiddleware.ts" @'
import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors.js";

/** Converts thrown errors into the standard API error envelope. */
export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  const appError = error instanceof AppError ? error : new AppError("Unexpected server error");
  res.status(appError.statusCode).json({
    success: false,
    error: { message: appError.message, code: appError.code }
  });
};
'@

Write-ProjectFile "$kanbanRoot/server/src/middleware/validate.ts" @'
import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { ValidationError } from "../utils/errors.js";

/** Validates request body data with Zod before controller execution. */
export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(new ValidationError(result.error.issues[0]?.message));
    req.body = result.data;
    next();
  };
}
'@

Write-ProjectFile "$kanbanRoot/server/src/validators/kanbanValidators.ts" @'
import { z } from "zod";

export const boardSchema = z.object({ name: z.string().min(1).max(100), background: z.string().max(50).optional() });
export const listSchema = z.object({ name: z.string().min(1).max(100), position: z.number().optional() });
export const cardSchema = z.object({ title: z.string().min(1).max(255), description: z.string().nullable().optional(), dueDate: z.string().nullable().optional(), position: z.number().optional() });
export const moveCardSchema = z.object({ listId: z.coerce.number().int().positive(), position: z.number() });
export const moveListSchema = z.object({ position: z.number() });
export const labelSchema = z.object({ name: z.string().max(50).nullable().optional(), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) });
export const checklistSchema = z.object({ title: z.string().max(100).optional(), position: z.number().int().optional() });
export const checklistItemSchema = z.object({ content: z.string().min(1).max(500), isChecked: z.boolean().optional(), position: z.number().int().optional() });
'@

Write-ProjectFile "$kanbanRoot/server/src/models/kanbanModel.ts" @'
import type { Knex } from "knex";
import { db } from "../config/db.js";
import type { BoardInput, CardInput, ChecklistInput, ChecklistItemInput, LabelInput, ListInput, MoveCardInput } from "../types/index.js";

/** Lists boards owned by the demo user. */
export async function findBoards(userId: number) {
  return db("boards").where({ user_id: userId }).orderBy("updated_at", "desc");
}

/** Finds one board by id and owner. */
export async function findBoard(boardId: number, userId: number) {
  return db("boards").where({ id: boardId, user_id: userId }).first();
}

/** Finds one board by public share token. */
export async function findBoardByToken(token: string) {
  return db("boards").where({ share_token: token }).first();
}

/** Creates a board row. */
export async function insertBoard(userId: number, input: BoardInput) {
  const [board] = await db("boards").insert({ user_id: userId, name: input.name, background: input.background ?? "#2563eb" }).returning("*");
  return board;
}

/** Updates board display fields. */
export async function updateBoard(boardId: number, input: Partial<BoardInput> & { shareToken?: string }) {
  const [board] = await db("boards").where({ id: boardId }).update({ name: input.name, background: input.background, share_token: input.shareToken, updated_at: db.fn.now() }).returning("*");
  return board;
}

/** Deletes a board and cascades nested content. */
export async function deleteBoard(boardId: number) {
  return db("boards").where({ id: boardId }).delete();
}

/** Loads a board aggregate with lists, cards, labels, checklists, and activity. */
export async function loadBoardTree(boardId: number) {
  const [board, lists, cards, labels, cardLabels, checklists, items, activity] = await Promise.all([
    db("boards").where({ id: boardId }).first(),
    db("lists").where({ board_id: boardId }).orderBy("position"),
    db("cards").join("lists", "cards.list_id", "lists.id").where("lists.board_id", boardId).select("cards.*").orderBy("cards.position"),
    db("labels").where({ board_id: boardId }).orderBy("id"),
    db("card_labels").join("labels", "card_labels.label_id", "labels.id").where("labels.board_id", boardId).select("card_labels.*"),
    db("checklists").join("cards", "checklists.card_id", "cards.id").join("lists", "cards.list_id", "lists.id").where("lists.board_id", boardId).select("checklists.*").orderBy("position"),
    db("checklist_items").join("checklists", "checklist_items.checklist_id", "checklists.id").join("cards", "checklists.card_id", "cards.id").join("lists", "cards.list_id", "lists.id").where("lists.board_id", boardId).select("checklist_items.*").orderBy("position"),
    db("activity_log").where({ board_id: boardId }).orderBy("created_at", "desc").limit(25)
  ]);
  return { board, lists, cards, labels, cardLabels, checklists, items, activity };
}

/** Inserts a list into a board. */
export async function insertList(boardId: number, input: ListInput) {
  const [list] = await db("lists").insert({ board_id: boardId, name: input.name, position: input.position ?? 1024 }).returning("*");
  return list;
}

/** Updates list name or position. */
export async function updateList(listId: number, input: Partial<ListInput>) {
  const [list] = await db("lists").where({ id: listId }).update({ name: input.name, position: input.position, updated_at: db.fn.now() }).returning("*");
  return list;
}

/** Deletes a list and cascades cards. */
export async function deleteList(listId: number) {
  return db("lists").where({ id: listId }).delete();
}

/** Inserts a card in a list. */
export async function insertCard(listId: number, input: CardInput) {
  const [card] = await db("cards").insert({ list_id: listId, title: input.title, description: input.description, due_date: input.dueDate, position: input.position ?? 1024 }).returning("*");
  return card;
}

/** Finds a card with related detail collections. */
export async function findCardDetail(cardId: number) {
  const [card, labels, checklists, activity] = await Promise.all([
    db("cards").where({ id: cardId }).first(),
    db("labels").join("card_labels", "labels.id", "card_labels.label_id").where("card_labels.card_id", cardId).select("labels.*"),
    db("checklists").where({ card_id: cardId }).orderBy("position"),
    db("activity_log").where({ card_id: cardId }).orderBy("created_at", "desc")
  ]);
  const items = await db("checklist_items").whereIn("checklist_id", checklists.map((item) => item.id).concat([-1])).orderBy("position");
  return { card, labels, checklists: checklists.map((checklist) => ({ ...checklist, items: items.filter((item) => item.checklist_id === checklist.id) })), activity };
}

/** Updates card fields. */
export async function updateCard(cardId: number, input: Partial<CardInput>) {
  const [card] = await db("cards").where({ id: cardId }).update({ title: input.title, description: input.description, due_date: input.dueDate, position: input.position, updated_at: db.fn.now() }).returning("*");
  return card;
}

/** Moves a card to a list and persisted fractional position. */
export async function moveCard(cardId: number, input: MoveCardInput) {
  const [card] = await db("cards").where({ id: cardId }).update({ list_id: input.listId, position: input.position, updated_at: db.fn.now() }).returning("*");
  return card;
}

/** Deletes a card row. */
export async function deleteCard(cardId: number) {
  return db("cards").where({ id: cardId }).delete();
}

/** Inserts a board label. */
export async function insertLabel(boardId: number, input: LabelInput) {
  const [label] = await db("labels").insert({ board_id: boardId, name: input.name, color: input.color }).returning("*");
  return label;
}

/** Updates a label. */
export async function updateLabel(labelId: number, input: LabelInput) {
  const [label] = await db("labels").where({ id: labelId }).update(input).returning("*");
  return label;
}

/** Deletes a label. */
export async function deleteLabel(labelId: number) {
  return db("labels").where({ id: labelId }).delete();
}

/** Attaches a label to a card. */
export async function assignLabel(cardId: number, labelId: number) {
  return db("card_labels").insert({ card_id: cardId, label_id: labelId }).onConflict(["card_id", "label_id"]).ignore();
}

/** Removes a label from a card. */
export async function removeLabel(cardId: number, labelId: number) {
  return db("card_labels").where({ card_id: cardId, label_id: labelId }).delete();
}

/** Creates a checklist. */
export async function insertChecklist(cardId: number, input: ChecklistInput) {
  const [checklist] = await db("checklists").insert({ card_id: cardId, title: input.title ?? "Checklist", position: input.position ?? 1 }).returning("*");
  return checklist;
}

/** Updates a checklist title. */
export async function updateChecklist(checklistId: number, title: string) {
  const [checklist] = await db("checklists").where({ id: checklistId }).update({ title }).returning("*");
  return checklist;
}

/** Deletes a checklist. */
export async function deleteChecklist(checklistId: number) {
  return db("checklists").where({ id: checklistId }).delete();
}

/** Inserts a checklist item. */
export async function insertChecklistItem(checklistId: number, input: ChecklistItemInput) {
  const [item] = await db("checklist_items").insert({ checklist_id: checklistId, content: input.content, is_checked: input.isChecked ?? false, position: input.position ?? 1 }).returning("*");
  return item;
}

/** Updates checklist item content, checked state, or position. */
export async function updateChecklistItem(itemId: number, input: Partial<ChecklistItemInput>) {
  const [item] = await db("checklist_items").where({ id: itemId }).update({ content: input.content, is_checked: input.isChecked, position: input.position }).returning("*");
  return item;
}

/** Deletes a checklist item. */
export async function deleteChecklistItem(itemId: number) {
  return db("checklist_items").where({ id: itemId }).delete();
}

/** Inserts an activity log entry, optionally inside an existing transaction. */
export async function insertActivity(input: { boardId: number; cardId?: number | null; userId: number; action: string; details?: unknown }, trx: Knex = db) {
  const [activity] = await trx("activity_log").insert({ board_id: input.boardId, card_id: input.cardId, user_id: input.userId, action: input.action, details: input.details ? JSON.stringify(input.details) : null }).returning("*");
  return activity;
}

/** Lists board activity in reverse chronological order. */
export async function findActivity(boardId: number) {
  return db("activity_log").where({ board_id: boardId }).orderBy("created_at", "desc");
}
'@

Write-ProjectFile "$kanbanRoot/server/src/services/positionService.ts" @'
/** Calculates a fractional position between optional neighboring positions. */
export function calculatePosition(previous?: number | null, next?: number | null): number {
  if (previous == null && next == null) return 1024;
  if (previous == null && next != null) return next / 2;
  if (previous != null && next == null) return previous + 1024;
  return ((previous as number) + (next as number)) / 2;
}

/** Signals when fractional positions should be compacted back to 1024 steps. */
export function shouldReindex(previous: number, next: number): boolean {
  return Math.abs(next - previous) < 0.001;
}
'@

Write-ProjectFile "$kanbanRoot/server/src/services/kanbanService.ts" @'
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { NotFoundError } from "../utils/errors.js";
import * as model from "../models/kanbanModel.js";
import type { BoardInput, CardInput, ChecklistInput, ChecklistItemInput, LabelInput, ListInput, MoveCardInput } from "../types/index.js";

/** Lists boards for the current demo user. */
export async function listBoards() {
  return model.findBoards(env.DEMO_USER_ID);
}

/** Creates a board and records an initial activity event. */
export async function createBoard(input: BoardInput) {
  const board = await model.insertBoard(env.DEMO_USER_ID, input);
  await model.insertActivity({ boardId: board.id, userId: env.DEMO_USER_ID, action: "board_created", details: { name: board.name } });
  return board;
}

/** Loads a board as a nested DTO suitable for the React board view. */
export async function getBoard(boardId: number) {
  const owned = await model.findBoard(boardId, env.DEMO_USER_ID);
  if (!owned) throw new NotFoundError("Board not found");
  return nestBoard(await model.loadBoardTree(boardId));
}

/** Loads a board by share token without mutating any data. */
export async function getSharedBoard(token: string) {
  const board = await model.findBoardByToken(token);
  if (!board) throw new NotFoundError("Shared board not found");
  return nestBoard(await model.loadBoardTree(board.id));
}

/** Updates board metadata. */
export async function updateBoard(boardId: number, input: Partial<BoardInput>) {
  await assertBoard(boardId);
  return model.updateBoard(boardId, input);
}

/** Deletes a board owned by the demo user. */
export async function removeBoard(boardId: number) {
  await assertBoard(boardId);
  await model.deleteBoard(boardId);
  return { deleted: true };
}

/** Generates and stores a public read-only share token. */
export async function shareBoard(boardId: number) {
  await assertBoard(boardId);
  const shareToken = crypto.randomBytes(24).toString("hex");
  return model.updateBoard(boardId, { shareToken });
}

/** Creates a list at a caller-provided or default fractional position. */
export async function createList(boardId: number, input: ListInput) {
  await assertBoard(boardId);
  const list = await model.insertList(boardId, input);
  await model.insertActivity({ boardId, userId: env.DEMO_USER_ID, action: "list_created", details: { name: list.name } });
  return list;
}

/** Updates list title or persisted position. */
export async function updateList(listId: number, input: Partial<ListInput>) {
  return model.updateList(listId, input);
}

/** Removes a list and nested cards. */
export async function removeList(listId: number) {
  await model.deleteList(listId);
  return { deleted: true };
}

/** Creates a card and writes activity for the board. */
export async function createCard(listId: number, input: CardInput) {
  const card = await model.insertCard(listId, input);
  const boardId = await boardIdForList(listId);
  await model.insertActivity({ boardId, cardId: card.id, userId: env.DEMO_USER_ID, action: "card_created", details: { title: card.title } });
  return card;
}

/** Gets a detail view for one card. */
export async function getCard(cardId: number) {
  const detail = await model.findCardDetail(cardId);
  if (!detail.card) throw new NotFoundError("Card not found");
  return detail;
}

/** Updates a card and logs the change. */
export async function updateCard(cardId: number, input: Partial<CardInput>) {
  const card = await model.updateCard(cardId, input);
  if (!card) throw new NotFoundError("Card not found");
  await model.insertActivity({ boardId: await boardIdForCard(cardId), cardId, userId: env.DEMO_USER_ID, action: "card_updated", details: input });
  return card;
}

/** Moves a card between lists using a fractional position. */
export async function moveCard(cardId: number, input: MoveCardInput) {
  const card = await model.moveCard(cardId, input);
  if (!card) throw new NotFoundError("Card not found");
  await model.insertActivity({ boardId: await boardIdForList(input.listId), cardId, userId: env.DEMO_USER_ID, action: "card_moved", details: input });
  return card;
}

/** Deletes a card. */
export async function removeCard(cardId: number) {
  await model.deleteCard(cardId);
  return { deleted: true };
}

/** Creates a label scoped to a board. */
export async function createLabel(boardId: number, input: LabelInput) {
  await assertBoard(boardId);
  return model.insertLabel(boardId, input);
}

/** Updates a label. */
export async function updateLabel(labelId: number, input: LabelInput) {
  return model.updateLabel(labelId, input);
}

/** Removes a label. */
export async function removeLabel(labelId: number) {
  await model.deleteLabel(labelId);
  return { deleted: true };
}

/** Assigns a label to a card. */
export async function assignLabel(cardId: number, labelId: number) {
  await model.assignLabel(cardId, labelId);
  return { assigned: true };
}

/** Removes a label assignment from a card. */
export async function unassignLabel(cardId: number, labelId: number) {
  await model.removeLabel(cardId, labelId);
  return { assigned: false };
}

/** Creates a checklist for a card. */
export async function createChecklist(cardId: number, input: ChecklistInput) {
  const checklist = await model.insertChecklist(cardId, input);
  await model.insertActivity({ boardId: await boardIdForCard(cardId), cardId, userId: env.DEMO_USER_ID, action: "checklist_created", details: { title: checklist.title } });
  return checklist;
}

/** Updates a checklist title. */
export async function updateChecklist(checklistId: number, title: string) {
  return model.updateChecklist(checklistId, title);
}

/** Deletes a checklist. */
export async function removeChecklist(checklistId: number) {
  await model.deleteChecklist(checklistId);
  return { deleted: true };
}

/** Adds an item to a checklist. */
export async function createChecklistItem(checklistId: number, input: ChecklistItemInput) {
  return model.insertChecklistItem(checklistId, input);
}

/** Updates a checklist item. */
export async function updateChecklistItem(itemId: number, input: Partial<ChecklistItemInput>) {
  return model.updateChecklistItem(itemId, input);
}

/** Deletes a checklist item. */
export async function removeChecklistItem(itemId: number) {
  await model.deleteChecklistItem(itemId);
  return { deleted: true };
}

/** Lists activity for a board. */
export async function listActivity(boardId: number) {
  await assertBoard(boardId);
  return model.findActivity(boardId);
}

/** Ensures the board belongs to the demo user. */
async function assertBoard(boardId: number) {
  const board = await model.findBoard(boardId, env.DEMO_USER_ID);
  if (!board) throw new NotFoundError("Board not found");
  return board;
}

/** Finds a board id from a list id. */
async function boardIdForList(listId: number) {
  const tree = await import("../config/db.js");
  const row = await tree.db("lists").where({ id: listId }).first("board_id");
  if (!row) throw new NotFoundError("List not found");
  return row.board_id as number;
}

/** Finds a board id from a card id. */
async function boardIdForCard(cardId: number) {
  const tree = await import("../config/db.js");
  const row = await tree.db("cards").join("lists", "cards.list_id", "lists.id").where("cards.id", cardId).first("lists.board_id");
  if (!row) throw new NotFoundError("Card not found");
  return row.board_id as number;
}

/** Converts flat query results into a board nested with lists and cards. */
function nestBoard(data: Awaited<ReturnType<typeof model.loadBoardTree>>) {
  const cards = data.cards.map((card) => ({
    ...card,
    labels: data.cardLabels.filter((join) => join.card_id === card.id).map((join) => data.labels.find((label) => label.id === join.label_id)).filter(Boolean),
    checklists: data.checklists.filter((checklist) => checklist.card_id === card.id).map((checklist) => ({
      ...checklist,
      items: data.items.filter((item) => item.checklist_id === checklist.id)
    }))
  }));
  return { ...data.board, labels: data.labels, activity: data.activity, lists: data.lists.map((list) => ({ ...list, cards: cards.filter((card) => card.list_id === list.id) })) };
}
'@

Write-ProjectFile "$kanbanRoot/server/src/controllers/kanbanController.ts" @'
import type { RequestHandler } from "express";
import { sendSuccess } from "../utils/response.js";
import * as service from "../services/kanbanService.js";

const id = (value: string) => Number(value);

/** Handles board list requests. */
export const listBoards: RequestHandler = async (_req, res, next) => { try { sendSuccess(res, await service.listBoards()); } catch (error) { next(error); } };
/** Handles board detail requests. */
export const getBoard: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.getBoard(id(req.params.id))); } catch (error) { next(error); } };
/** Handles shared board requests. */
export const getSharedBoard: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.getSharedBoard(req.params.token)); } catch (error) { next(error); } };
/** Handles board creation. */
export const createBoard: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.createBoard(req.body), 201); } catch (error) { next(error); } };
/** Handles board updates. */
export const updateBoard: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.updateBoard(id(req.params.id), req.body)); } catch (error) { next(error); } };
/** Handles board deletion. */
export const deleteBoard: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.removeBoard(id(req.params.id))); } catch (error) { next(error); } };
/** Handles share-token creation. */
export const shareBoard: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.shareBoard(id(req.params.id))); } catch (error) { next(error); } };
/** Handles list creation. */
export const createList: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.createList(id(req.params.boardId), req.body), 201); } catch (error) { next(error); } };
/** Handles list updates. */
export const updateList: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.updateList(id(req.params.id), req.body)); } catch (error) { next(error); } };
/** Handles list moves. */
export const moveList: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.updateList(id(req.params.id), req.body)); } catch (error) { next(error); } };
/** Handles list deletion. */
export const deleteList: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.removeList(id(req.params.id))); } catch (error) { next(error); } };
/** Handles card creation. */
export const createCard: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.createCard(id(req.params.listId), req.body), 201); } catch (error) { next(error); } };
/** Handles card detail requests. */
export const getCard: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.getCard(id(req.params.id))); } catch (error) { next(error); } };
/** Handles card updates. */
export const updateCard: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.updateCard(id(req.params.id), req.body)); } catch (error) { next(error); } };
/** Handles card moves. */
export const moveCard: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.moveCard(id(req.params.id), req.body)); } catch (error) { next(error); } };
/** Handles card deletion. */
export const deleteCard: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.removeCard(id(req.params.id))); } catch (error) { next(error); } };
/** Handles label creation. */
export const createLabel: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.createLabel(id(req.params.boardId), req.body), 201); } catch (error) { next(error); } };
/** Handles label updates. */
export const updateLabel: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.updateLabel(id(req.params.id), req.body)); } catch (error) { next(error); } };
/** Handles label deletion. */
export const deleteLabel: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.removeLabel(id(req.params.id))); } catch (error) { next(error); } };
/** Handles card label assignment. */
export const assignLabel: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.assignLabel(id(req.params.cardId), id(req.params.labelId))); } catch (error) { next(error); } };
/** Handles card label removal. */
export const removeLabel: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.unassignLabel(id(req.params.cardId), id(req.params.labelId))); } catch (error) { next(error); } };
/** Handles checklist creation. */
export const createChecklist: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.createChecklist(id(req.params.cardId), req.body), 201); } catch (error) { next(error); } };
/** Handles checklist title updates. */
export const updateChecklist: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.updateChecklist(id(req.params.id), req.body.title)); } catch (error) { next(error); } };
/** Handles checklist deletion. */
export const deleteChecklist: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.removeChecklist(id(req.params.id))); } catch (error) { next(error); } };
/** Handles checklist item creation. */
export const createChecklistItem: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.createChecklistItem(id(req.params.checklistId), req.body), 201); } catch (error) { next(error); } };
/** Handles checklist item updates. */
export const updateChecklistItem: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.updateChecklistItem(id(req.params.id), req.body)); } catch (error) { next(error); } };
/** Handles checklist item deletion. */
export const deleteChecklistItem: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.removeChecklistItem(id(req.params.id))); } catch (error) { next(error); } };
/** Handles board activity requests. */
export const listActivity: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.listActivity(id(req.params.boardId))); } catch (error) { next(error); } };
'@

Write-ProjectFile "$kanbanRoot/server/src/routes/kanbanRoutes.ts" @'
import { Router } from "express";
import * as controller from "../controllers/kanbanController.js";
import { validateBody } from "../middleware/validate.js";
import { boardSchema, cardSchema, checklistItemSchema, checklistSchema, labelSchema, listSchema, moveCardSchema, moveListSchema } from "../validators/kanbanValidators.js";

export const kanbanRouter = Router();

kanbanRouter.get("/boards", controller.listBoards);
kanbanRouter.get("/boards/shared/:token", controller.getSharedBoard);
kanbanRouter.get("/boards/:id", controller.getBoard);
kanbanRouter.post("/boards", validateBody(boardSchema), controller.createBoard);
kanbanRouter.put("/boards/:id", validateBody(boardSchema.partial()), controller.updateBoard);
kanbanRouter.delete("/boards/:id", controller.deleteBoard);
kanbanRouter.post("/boards/:id/share", controller.shareBoard);
kanbanRouter.post("/boards/:boardId/lists", validateBody(listSchema), controller.createList);
kanbanRouter.put("/lists/:id", validateBody(listSchema.partial()), controller.updateList);
kanbanRouter.put("/lists/:id/move", validateBody(moveListSchema), controller.moveList);
kanbanRouter.delete("/lists/:id", controller.deleteList);
kanbanRouter.post("/lists/:listId/cards", validateBody(cardSchema), controller.createCard);
kanbanRouter.get("/cards/:id", controller.getCard);
kanbanRouter.put("/cards/:id", validateBody(cardSchema.partial()), controller.updateCard);
kanbanRouter.put("/cards/:id/move", validateBody(moveCardSchema), controller.moveCard);
kanbanRouter.delete("/cards/:id", controller.deleteCard);
kanbanRouter.post("/boards/:boardId/labels", validateBody(labelSchema), controller.createLabel);
kanbanRouter.put("/labels/:id", validateBody(labelSchema), controller.updateLabel);
kanbanRouter.delete("/labels/:id", controller.deleteLabel);
kanbanRouter.post("/cards/:cardId/labels/:labelId", controller.assignLabel);
kanbanRouter.delete("/cards/:cardId/labels/:labelId", controller.removeLabel);
kanbanRouter.post("/cards/:cardId/checklists", validateBody(checklistSchema), controller.createChecklist);
kanbanRouter.put("/checklists/:id", validateBody(checklistSchema), controller.updateChecklist);
kanbanRouter.delete("/checklists/:id", controller.deleteChecklist);
kanbanRouter.post("/checklists/:checklistId/items", validateBody(checklistItemSchema), controller.createChecklistItem);
kanbanRouter.put("/checklist-items/:id", validateBody(checklistItemSchema.partial()), controller.updateChecklistItem);
kanbanRouter.delete("/checklist-items/:id", controller.deleteChecklistItem);
kanbanRouter.get("/boards/:boardId/activity", controller.listActivity);
'@

Write-ProjectFile "$kanbanRoot/server/src/app.ts" @'
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { kanbanRouter } from "./routes/kanbanRoutes.js";

/** Creates and configures the Express app for Project 8. */
export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json());
  app.use(morgan("dev"));
  app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
  app.use("/api", kanbanRouter);
  app.use(errorMiddleware);
  return app;
}
'@

Write-ProjectFile "$kanbanRoot/server/src/server.ts" @'
import { createApp } from "./app.js";
import { env } from "./config/env.js";

/** Boots the HTTP server after configuration has been validated. */
function startServer() {
  createApp().listen(env.PORT, () => {
    console.log(`Kanban API listening on ${env.PORT}`);
  });
}

startServer();
'@

Write-ProjectFile "$kanbanRoot/server/db/migrations/001_create_kanban_tables.ts" @'
import type { Knex } from "knex";

/** Creates all Project 8 tables with reversible foreign-key order. */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("email", 255).notNullable().unique();
    table.string("name", 100).notNullable();
    table.timestamps(true, true);
  });
  await knex.schema.createTable("boards", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("name", 100).notNullable();
    table.string("background", 50).notNullable().defaultTo("#1e40af");
    table.string("share_token", 64).unique();
    table.timestamps(true, true);
  });
  await knex.schema.createTable("lists", (table) => {
    table.increments("id").primary();
    table.integer("board_id").notNullable().references("id").inTable("boards").onDelete("CASCADE");
    table.string("name", 100).notNullable();
    table.float("position").notNullable();
    table.timestamps(true, true);
  });
  await knex.schema.createTable("cards", (table) => {
    table.increments("id").primary();
    table.integer("list_id").notNullable().references("id").inTable("lists").onDelete("CASCADE");
    table.string("title", 255).notNullable();
    table.text("description");
    table.float("position").notNullable();
    table.date("due_date");
    table.boolean("is_complete").notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
  await knex.schema.createTable("labels", (table) => {
    table.increments("id").primary();
    table.integer("board_id").notNullable().references("id").inTable("boards").onDelete("CASCADE");
    table.string("name", 50);
    table.string("color", 7).notNullable();
  });
  await knex.schema.createTable("card_labels", (table) => {
    table.integer("card_id").notNullable().references("id").inTable("cards").onDelete("CASCADE");
    table.integer("label_id").notNullable().references("id").inTable("labels").onDelete("CASCADE");
    table.primary(["card_id", "label_id"]);
  });
  await knex.schema.createTable("checklists", (table) => {
    table.increments("id").primary();
    table.integer("card_id").notNullable().references("id").inTable("cards").onDelete("CASCADE");
    table.string("title", 100).notNullable().defaultTo("Checklist");
    table.integer("position").notNullable();
  });
  await knex.schema.createTable("checklist_items", (table) => {
    table.increments("id").primary();
    table.integer("checklist_id").notNullable().references("id").inTable("checklists").onDelete("CASCADE");
    table.string("content", 500).notNullable();
    table.boolean("is_checked").notNullable().defaultTo(false);
    table.integer("position").notNullable();
  });
  await knex.schema.createTable("activity_log", (table) => {
    table.increments("id").primary();
    table.integer("board_id").notNullable().references("id").inTable("boards").onDelete("CASCADE");
    table.integer("card_id").references("id").inTable("cards").onDelete("SET NULL");
    table.integer("user_id").notNullable().references("id").inTable("users");
    table.string("action", 50).notNullable();
    table.jsonb("details");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

/** Drops Project 8 tables in dependency order. */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("activity_log");
  await knex.schema.dropTableIfExists("checklist_items");
  await knex.schema.dropTableIfExists("checklists");
  await knex.schema.dropTableIfExists("card_labels");
  await knex.schema.dropTableIfExists("labels");
  await knex.schema.dropTableIfExists("cards");
  await knex.schema.dropTableIfExists("lists");
  await knex.schema.dropTableIfExists("boards");
  await knex.schema.dropTableIfExists("users");
}
'@

Write-ProjectFile "$kanbanRoot/server/db/seeds/001_seed_kanban.ts" @'
import type { Knex } from "knex";

/** Seeds realistic boards, lists, labels, cards, checklists, and activity. */
export async function seed(knex: Knex): Promise<void> {
  await knex("activity_log").del();
  await knex("checklist_items").del();
  await knex("checklists").del();
  await knex("card_labels").del();
  await knex("labels").del();
  await knex("cards").del();
  await knex("lists").del();
  await knex("boards").del();
  await knex("users").del();

  const users = await knex("users").insert([{ email: "avery@example.com", name: "Avery Stone" }, { email: "morgan@example.com", name: "Morgan Lee" }]).returning("*");
  const boards = await knex("boards").insert([
    { user_id: users[0].id, name: "Personal", background: "#2563eb", share_token: "personal-demo-share" },
    { user_id: users[0].id, name: "Work Project", background: "#0f766e" },
    { user_id: users[1].id, name: "Reading List", background: "#7c3aed" }
  ]).returning("*");

  for (const board of boards) {
    const lists = await knex("lists").insert(["Backlog", "This Week", "Doing", "Review", "Done"].map((name, index) => ({ board_id: board.id, name, position: (index + 1) * 1024 }))).returning("*");
    const labels = await knex("labels").insert([
      { board_id: board.id, name: "Urgent", color: "#ef4444" },
      { board_id: board.id, name: "Writing", color: "#22c55e" },
      { board_id: board.id, name: "Research", color: "#3b82f6" }
    ]).returning("*");
    for (const [index, list] of lists.entries()) {
      const cards = await knex("cards").insert([0, 1, 2].map((offset) => ({
        list_id: list.id,
        title: `${list.name} card ${offset + 1}`,
        description: "Readable seed card with markdown-friendly notes.",
        position: (offset + 1) * 1024,
        due_date: offset === 0 ? knex.raw("CURRENT_DATE + INTERVAL '3 days'") : null
      }))).returning("*");
      for (const card of cards) {
        await knex("card_labels").insert({ card_id: card.id, label_id: labels[(card.id + index) % labels.length].id });
        const [checklist] = await knex("checklists").insert({ card_id: card.id, title: "Definition of done", position: 1 }).returning("*");
        await knex("checklist_items").insert([
          { checklist_id: checklist.id, content: "Clarify scope", is_checked: true, position: 1 },
          { checklist_id: checklist.id, content: "Ship a small version", is_checked: index > 2, position: 2 }
        ]);
        await knex("activity_log").insert({ board_id: board.id, card_id: card.id, user_id: board.user_id, action: "card_created", details: JSON.stringify({ title: card.title }) });
      }
    }
  }
}
'@

Write-ProjectFile "$kanbanRoot/client/package.json" @'
{
  "name": "08-kanban-board-client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5178",
    "build": "tsc && vite build",
    "preview": "vite preview --host 0.0.0.0"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.2.0",
    "@dnd-kit/sortable": "^10.0.0",
    "@tanstack/react-query": "^5.62.8",
    "axios": "^1.7.9",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.7"
  }
}
'@

Write-ProjectFile "$kanbanRoot/client/tsconfig.json" @'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
'@

Write-ProjectFile "$kanbanRoot/client/vite.config.ts" @'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({ plugins: [react()] });
'@

Write-ProjectFile "$kanbanRoot/client/index.html" @'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kanban Board</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
'@

Write-ProjectFile "$kanbanRoot/client/src/types/index.ts" @'
export interface Label { id: number; name: string | null; color: string }
export interface ChecklistItem { id: number; content: string; is_checked: boolean }
export interface Checklist { id: number; title: string; items: ChecklistItem[] }
export interface Card { id: number; list_id: number; title: string; description?: string; due_date?: string; position: number; labels: Label[]; checklists: Checklist[] }
export interface List { id: number; name: string; position: number; cards: Card[] }
export interface Board { id: number; name: string; background: string; share_token?: string; labels: Label[]; lists: List[]; activity: Array<{ id: number; action: string; created_at: string }> }
'@

Write-ProjectFile "$kanbanRoot/client/src/services/api.ts" @'
import axios from "axios";
import type { Board } from "../types";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4108/api" });

/** Unwraps the standard API success envelope. */
function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

/** Fetches all boards for the demo user. */
export async function fetchBoards() {
  return unwrap<Array<Pick<Board, "id" | "name" | "background">>>(await api.get("/boards"));
}

/** Fetches a full board aggregate by id. */
export async function fetchBoard(id: number) {
  return unwrap<Board>(await api.get(`/boards/${id}`));
}

/** Creates a board. */
export async function createBoard(input: { name: string; background: string }) {
  return unwrap(await api.post("/boards", input));
}

/** Creates a list inside a board. */
export async function createList(boardId: number, input: { name: string; position: number }) {
  return unwrap(await api.post(`/boards/${boardId}/lists`, input));
}

/** Creates a card inside a list. */
export async function createCard(listId: number, input: { title: string; position: number }) {
  return unwrap(await api.post(`/lists/${listId}/cards`, input));
}

/** Persists a drag-and-drop card movement. */
export async function moveCard(cardId: number, input: { listId: number; position: number }) {
  return unwrap(await api.put(`/cards/${cardId}/move`, input));
}

/** Generates a read-only share link token. */
export async function shareBoard(boardId: number) {
  return unwrap<{ share_token: string }>(await api.post(`/boards/${boardId}/share`));
}
'@

Write-ProjectFile "$kanbanRoot/client/src/components/ui/Button.tsx" @'
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import styles from "./Button.module.css";

/** Shared button primitive with consistent app styling. */
export function Button({ children, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return <button className={styles.button} {...props}>{children}</button>;
}
'@

Write-ProjectFile "$kanbanRoot/client/src/components/ui/Button.module.css" @'
.button {
  border: 0;
  border-radius: 6px;
  background: #111827;
  color: #fff;
  padding: 0.65rem 0.9rem;
  font-weight: 700;
  cursor: pointer;
}
.button:disabled { opacity: 0.55; cursor: not-allowed; }
'@

Write-ProjectFile "$kanbanRoot/client/src/pages/BoardsPage.tsx" @'
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createBoard, fetchBoards } from "../services/api";
import { Button } from "../components/ui/Button";
import styles from "./Kanban.module.css";

/** Shows board thumbnails and a quick-create action. */
export function BoardsPage() {
  const queryClient = useQueryClient();
  const boards = useQuery({ queryKey: ["boards"], queryFn: fetchBoards });
  const create = useMutation({
    mutationFn: createBoard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["boards"] })
  });

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Project 8</p>
          <h1>Kanban boards</h1>
        </div>
        <Button onClick={() => create.mutate({ name: "New launch board", background: "#0f766e" })}>New board</Button>
      </header>
      <section className={styles.boardGrid}>
        {boards.data?.map((board) => (
          <Link key={board.id} to={`/boards/${board.id}`} className={styles.boardCard} style={{ background: board.background }}>
            <span>{board.name}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
'@

Write-ProjectFile "$kanbanRoot/client/src/pages/BoardPage.tsx" @'
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { createCard, createList, fetchBoard, moveCard, shareBoard } from "../services/api";
import type { Board, Card, List } from "../types";
import styles from "./Kanban.module.css";

/** Calculates a fractional position for optimistic inserts and drag moves. */
function nextPosition(items: Array<{ position: number }>) {
  return items.length ? Math.max(...items.map((item) => item.position)) + 1024 : 1024;
}

/** Returns true when a card due date is before today and visually overdue. */
function isOverdue(card: Card) {
  return Boolean(card.due_date && new Date(card.due_date) < new Date());
}

/** Full board view with dnd-kit wiring and optimistic reorder persistence. */
export function BoardPage() {
  const { id } = useParams();
  const boardId = Number(id);
  const queryClient = useQueryClient();
  const [optimisticBoard, setOptimisticBoard] = useState<Board | null>(null);
  const boardQuery = useQuery({ queryKey: ["board", boardId], queryFn: () => fetchBoard(boardId), enabled: Number.isFinite(boardId) });
  const board = optimisticBoard ?? boardQuery.data;
  const addList = useMutation({ mutationFn: (name: string) => createList(boardId, { name, position: nextPosition(board?.lists ?? []) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board", boardId] }) });
  const addCard = useMutation({ mutationFn: (list: List) => createCard(list.id, { title: "New card", position: nextPosition(list.cards) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board", boardId] }) });
  const move = useMutation({ mutationFn: ({ card, list }: { card: Card; list: List }) => moveCard(card.id, { listId: list.id, position: nextPosition(list.cards) }), onSettled: () => { setOptimisticBoard(null); queryClient.invalidateQueries({ queryKey: ["board", boardId] }); } });
  const share = useMutation({ mutationFn: () => shareBoard(boardId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board", boardId] }) });
  const cardIds = useMemo(() => board?.lists.flatMap((list) => list.cards.map((card) => String(card.id))) ?? [], [board]);

  /** Handles a drag end event by moving a card to the list it was dropped over. */
  function handleDragEnd(event: DragEndEvent) {
    if (!board || !event.over) return;
    const activeId = Number(event.active.id);
    const targetList = board.lists.find((list) => String(list.id) === event.over?.id) ?? board.lists.find((list) => list.cards.some((card) => String(card.id) === event.over?.id));
    const sourceList = board.lists.find((list) => list.cards.some((card) => card.id === activeId));
    const card = sourceList?.cards.find((item) => item.id === activeId);
    if (!targetList || !sourceList || !card || sourceList.id === targetList.id) return;
    setOptimisticBoard({ ...board, lists: board.lists.map((list) => list.id === sourceList.id ? { ...list, cards: list.cards.filter((item) => item.id !== card.id) } : list.id === targetList.id ? { ...list, cards: [...list.cards, { ...card, list_id: list.id }] } : list) });
    move.mutate({ card, list: targetList });
  }

  if (!board) return <main className={styles.shell}>Loading board...</main>;

  return (
    <main className={styles.boardShell} style={{ background: board.background }}>
      <header className={styles.boardHeader}>
        <div>
          <p className={styles.eyebrow}>Fractional positions, optimistic movement</p>
          <h1>{board.name}</h1>
        </div>
        <Button onClick={() => share.mutate()}>{board.share_token ? "Refresh share link" : "Share"}</Button>
      </header>
      {board.share_token && <p className={styles.share}>Share token: {board.share_token}</p>}
      <DndContext onDragEnd={handleDragEnd}>
        <SortableContext items={cardIds} strategy={horizontalListSortingStrategy}>
          <section className={styles.lanes}>
            {board.lists.map((list) => (
              <article key={list.id} id={String(list.id)} className={styles.list}>
                <header className={styles.listHeader}>
                  <h2>{list.name}</h2>
                  <Button onClick={() => addCard.mutate(list)}>+</Button>
                </header>
                <div className={styles.cards}>
                  {list.cards.map((card) => (
                    <button key={card.id} id={String(card.id)} className={`${styles.card} ${isOverdue(card) ? styles.overdue : ""}`}>
                      <span>{card.title}</span>
                      <div className={styles.labels}>{card.labels.map((label) => <i key={label.id} style={{ background: label.color }} />)}</div>
                      {card.checklists[0] && <small>{card.checklists[0].items.filter((item) => item.is_checked).length}/{card.checklists[0].items.length} checklist</small>}
                    </button>
                  ))}
                </div>
              </article>
            ))}
            <aside className={styles.addList}><Button onClick={() => addList.mutate("New list")}>Add list</Button></aside>
          </section>
        </SortableContext>
      </DndContext>
    </main>
  );
}
'@

Write-ProjectFile "$kanbanRoot/client/src/pages/Kanban.module.css" @'
.shell { min-height: 100vh; padding: 2rem; background: #f8fafc; color: #172033; }
.header, .boardHeader { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
.eyebrow { margin: 0; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; }
h1 { margin: 0.1rem 0 0; font-size: 2rem; }
.boardGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
.boardCard { min-height: 140px; border-radius: 8px; padding: 1rem; color: white; font-weight: 800; text-decoration: none; box-shadow: 0 18px 40px rgb(15 23 42 / 0.18); }
.boardShell { min-height: 100vh; padding: 1.5rem; color: white; }
.share { background: rgb(255 255 255 / 0.18); padding: 0.75rem; border-radius: 6px; }
.lanes { display: flex; align-items: flex-start; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; }
.list { width: 300px; flex: 0 0 300px; background: #f1f5f9; color: #0f172a; border-radius: 8px; padding: 0.75rem; }
.listHeader { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.listHeader h2 { margin: 0; font-size: 1rem; }
.cards { display: grid; gap: 0.65rem; }
.card { display: grid; gap: 0.45rem; text-align: left; width: 100%; border: 1px solid #dbe3ef; border-radius: 6px; background: white; padding: 0.75rem; color: #172033; cursor: grab; }
.overdue { border-color: #ef4444; box-shadow: inset 3px 0 0 #ef4444; }
.labels { display: flex; gap: 0.25rem; }
.labels i { width: 34px; height: 7px; border-radius: 999px; }
.addList { width: 220px; flex: 0 0 220px; background: rgb(255 255 255 / 0.2); border-radius: 8px; padding: 0.75rem; }
'@

Write-ProjectFile "$kanbanRoot/client/src/App.tsx" @'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { BoardPage } from "./pages/BoardPage";
import { BoardsPage } from "./pages/BoardsPage";

const queryClient = new QueryClient();

/** Wires routing and React Query for the Kanban app. */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BoardsPage />} />
          <Route path="/boards/:id" element={<BoardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
'@

Write-ProjectFile "$kanbanRoot/client/src/main.tsx" @'
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
'@

Write-ProjectFile "$kanbanRoot/client/src/index.css" @'
:root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; background: #f8fafc; }
* { box-sizing: border-box; }
body { margin: 0; }
button, input, select, textarea { font: inherit; }
'@

Write-ProjectFile "$jobRoot/.env.example" @'
NODE_ENV=development
PORT=4109
CLIENT_ORIGIN=http://localhost:5179
DATABASE_URL=postgres://postgres:postgres@localhost:5432/job_application_tracker
DEMO_USER_ID=1
UPLOAD_DIR=uploads
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=jobs@example.com
'@

Write-ProjectFile "$jobRoot/README.md" @'
# Project 9: Job Application Tracker

A full-stack TypeScript app for tracking applications through a configurable pipeline. It demonstrates state-machine validation, transactional stage transitions, Multer upload wiring, dashboard KPIs, reminder/email concepts, contacts, notes, tags, and CSV export.

## Run locally

1. `cd 09-job-application-tracker/server && npm install`
2. Copy `../.env.example` to `../.env` and update database/SMTP values.
3. `npm run migrate && npm run seed && npm run dev`
4. `cd ../client && npm install && npm run dev`

The demo app uses `DEMO_USER_ID=1` instead of auth. Uploaded documents are stored under `server/uploads/`.
'@

Write-ProjectFile "$jobRoot/docs/architecture.md" @'
# Architecture

## Pipeline state machine

Stage order is stored in `pipeline_stages`. `transitionApplication` reads the current stage and destination stage, rejects invalid jumps, and updates `applications.current_stage_id` plus `stage_history` inside one Knex transaction.

## Uploads and reminders

Multer is configured in the route layer and delegates metadata persistence to the service. Reminder creation stores the scheduled email intent; `sendReminderDigest` shows the Nodemailer integration point without requiring a background worker.

## Dashboard

The stats service uses CTEs to calculate active counts, response rate, and average time to offer. The frontend turns those API results into KPI cards, a stage funnel, a weekly activity chart, and upcoming reminders.
'@

Write-ProjectFile "$jobRoot/server/package.json" @'
{
  "name": "09-job-application-tracker-server",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "migrate": "knex --knexfile knexfile.ts migrate:latest",
    "rollback": "knex --knexfile knexfile.ts migrate:rollback",
    "seed": "knex --knexfile knexfile.ts seed:run"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "date-fns": "^4.1.0",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "helmet": "^8.0.0",
    "knex": "^3.1.0",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.16",
    "pg": "^8.13.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/morgan": "^1.9.9",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.10.2",
    "@types/nodemailer": "^6.4.17",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
'@

Write-ProjectFile "$jobRoot/server/tsconfig.json" @'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["src", "db", "knexfile.ts"]
}
'@

Write-ProjectFile "$jobRoot/server/knexfile.ts" @'
import "dotenv/config";
import type { Knex } from "knex";

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: { directory: "./db/migrations", extension: "ts" },
    seeds: { directory: "./db/seeds", extension: "ts" }
  }
};

export default config;
'@

Write-ProjectFile "$jobRoot/server/src/config/env.ts" @'
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4109),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5179"),
  DATABASE_URL: z.string().min(1),
  DEMO_USER_ID: z.coerce.number().int().positive().default(1),
  UPLOAD_DIR: z.string().default("uploads"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_FROM: z.string().email().default("jobs@example.com")
});

/** Validates environment variables at application startup. */
export function loadEnv() {
  return envSchema.parse(process.env);
}

export const env = loadEnv();
'@

Write-ProjectFile "$jobRoot/server/src/config/db.ts" @'
import knex from "knex";
import config from "../../knexfile.js";
import { env } from "./env.js";

/** Shared Knex instance for the job tracker server. */
export const db = knex(config[env.NODE_ENV]);
'@

Write-ProjectFile "$jobRoot/server/src/utils/errors.ts" @'
/** Base HTTP-aware operational error. */
export class AppError extends Error {
  constructor(message: string, public statusCode = 500, public code = "APP_ERROR") { super(message); }
}

/** Error for records that do not exist for the current user. */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") { super(message, 404, "NOT_FOUND"); }
}

/** Error for invalid workflow transitions or request payloads. */
export class ValidationError extends AppError {
  constructor(message = "Validation failed") { super(message, 400, "VALIDATION_ERROR"); }
}
'@

Write-ProjectFile "$jobRoot/server/src/utils/response.ts" @'
import type { Response } from "express";

/** Sends a standard success envelope. */
export function sendSuccess<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}
'@

Write-ProjectFile "$jobRoot/server/src/middleware/errorMiddleware.ts" @'
import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors.js";

/** Centralized formatter for every thrown API error. */
export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  const appError = error instanceof AppError ? error : new AppError("Unexpected server error");
  res.status(appError.statusCode).json({ success: false, error: { message: appError.message, code: appError.code } });
};
'@

Write-ProjectFile "$jobRoot/server/src/middleware/validate.ts" @'
import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { ValidationError } from "../utils/errors.js";

/** Validates request bodies and replaces them with parsed values. */
export function validateBody(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(new ValidationError(parsed.error.issues[0]?.message));
    req.body = parsed.data;
    next();
  };
}
'@

Write-ProjectFile "$jobRoot/server/src/types/index.ts" @'
export interface ApplicationInput {
  companyName: string;
  positionTitle: string;
  jobUrl?: string | null;
  currentStageId: number;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  location?: string | null;
  workType: "remote" | "hybrid" | "onsite";
  appliedDate: string;
}
export interface TransitionInput { stageId: number; note?: string }
export interface NoteInput { content: string }
export interface ContactInput { name: string; email?: string | null; phone?: string | null; company?: string | null; role?: string | null; notes?: string | null }
export interface ReminderInput { applicationId: number; remindAt: string; message: string }
export interface TagInput { name: string; color: string }
'@

Write-ProjectFile "$jobRoot/server/src/validators/jobValidators.ts" @'
import { z } from "zod";

export const applicationSchema = z.object({
  companyName: z.string().min(1).max(200),
  positionTitle: z.string().min(1).max(200),
  jobUrl: z.string().url().nullable().optional(),
  currentStageId: z.coerce.number().int().positive(),
  salaryMin: z.coerce.number().int().nullable().optional(),
  salaryMax: z.coerce.number().int().nullable().optional(),
  salaryCurrency: z.string().length(3).default("USD"),
  location: z.string().max(200).nullable().optional(),
  workType: z.enum(["remote", "hybrid", "onsite"]).default("remote"),
  appliedDate: z.string().min(1)
});
export const transitionSchema = z.object({ stageId: z.coerce.number().int().positive(), note: z.string().optional() });
export const noteSchema = z.object({ content: z.string().min(1) });
export const contactSchema = z.object({ name: z.string().min(1).max(100), email: z.string().email().nullable().optional(), phone: z.string().nullable().optional(), company: z.string().nullable().optional(), role: z.string().nullable().optional(), notes: z.string().nullable().optional() });
export const reminderSchema = z.object({ applicationId: z.coerce.number().int().positive(), remindAt: z.string().min(1), message: z.string().min(1).max(500) });
export const tagSchema = z.object({ name: z.string().min(1).max(50), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) });
'@

Write-ProjectFile "$jobRoot/server/src/models/jobModel.ts" @'
import type { Knex } from "knex";
import { db } from "../config/db.js";
import type { ApplicationInput, ContactInput, NoteInput, ReminderInput, TagInput } from "../types/index.js";

/** Lists applications with optional filters. */
export async function findApplications(userId: number, filters: { stage?: string; search?: string; archived?: string; tag?: string }) {
  const query = db("applications as a").join("pipeline_stages as s", "a.current_stage_id", "s.id").where("a.user_id", userId).select("a.*", "s.name as stage_name", "s.color as stage_color");
  if (filters.stage) query.where("s.name", filters.stage);
  if (filters.archived !== undefined) query.where("a.is_archived", filters.archived === "true");
  if (filters.search) query.where((builder) => builder.whereILike("a.company_name", `%${filters.search}%`).orWhereILike("a.position_title", `%${filters.search}%`));
  if (filters.tag) query.whereIn("a.id", db("application_tags").join("tags", "tags.id", "application_tags.tag_id").where("tags.name", filters.tag).select("application_id"));
  return query.orderBy("a.applied_date", "desc");
}

/** Finds one application for a user. */
export async function findApplication(userId: number, id: number) {
  return db("applications").where({ user_id: userId, id }).first();
}

/** Inserts a new application. */
export async function insertApplication(userId: number, input: ApplicationInput) {
  const [application] = await db("applications").insert(toApplicationRow(userId, input)).returning("*");
  return application;
}

/** Updates editable application fields. */
export async function updateApplication(id: number, input: Partial<ApplicationInput>) {
  const [application] = await db("applications").where({ id }).update({ ...toPartialApplicationRow(input), updated_at: db.fn.now() }).returning("*");
  return application;
}

/** Deletes an application and dependent records. */
export async function deleteApplication(id: number) {
  return db("applications").where({ id }).delete();
}

/** Toggles archived state. */
export async function toggleArchive(id: number) {
  const [row] = await db("applications").where({ id }).update({ is_archived: db.raw("NOT is_archived"), updated_at: db.fn.now() }).returning("*");
  return row;
}

/** Lists stages for a user ordered as the pipeline. */
export async function findStages(userId: number) {
  return db("pipeline_stages").where({ user_id: userId }).orderBy("sort_order");
}

/** Finds a stage by id. */
export async function findStage(stageId: number) {
  return db("pipeline_stages").where({ id: stageId }).first();
}

/** Replaces stage names/colors/order for a user. */
export async function replaceStages(userId: number, stages: Array<{ id?: number; name: string; color: string; sortOrder: number; isTerminal?: boolean }>) {
  await db.transaction(async (trx) => {
    await trx("pipeline_stages").where({ user_id: userId }).delete();
    await trx("pipeline_stages").insert(stages.map((stage) => ({ user_id: userId, name: stage.name, color: stage.color, sort_order: stage.sortOrder, is_terminal: stage.isTerminal ?? false })));
  });
  return findStages(userId);
}

/** Atomically updates current stage and inserts stage history. */
export async function transitionApplication(trx: Knex.Transaction, input: { applicationId: number; fromStageId: number; toStageId: number; note?: string }) {
  const [application] = await trx("applications").where({ id: input.applicationId }).update({ current_stage_id: input.toStageId, updated_at: trx.fn.now() }).returning("*");
  await trx("stage_history").insert({ application_id: input.applicationId, from_stage_id: input.fromStageId, to_stage_id: input.toStageId, note: input.note });
  return application;
}

/** Loads full application detail relations. */
export async function findApplicationDetail(userId: number, id: number) {
  const application = await findApplication(userId, id);
  const [history, notes, documents, contacts, tags, reminders] = await Promise.all([
    db("stage_history as h").leftJoin("pipeline_stages as fs", "h.from_stage_id", "fs.id").join("pipeline_stages as ts", "h.to_stage_id", "ts.id").where("h.application_id", id).select("h.*", "fs.name as from_stage", "ts.name as to_stage").orderBy("h.transitioned_at", "desc"),
    db("application_notes").where({ application_id: id }).orderBy("created_at", "desc"),
    db("documents").where({ application_id: id }).orderBy("created_at", "desc"),
    db("contacts").join("application_contacts", "contacts.id", "application_contacts.contact_id").where("application_contacts.application_id", id).select("contacts.*"),
    db("tags").join("application_tags", "tags.id", "application_tags.tag_id").where("application_tags.application_id", id).select("tags.*"),
    db("reminders").where({ application_id: id, user_id: userId }).orderBy("remind_at")
  ]);
  return { application, history, notes, documents, contacts, tags, reminders };
}

/** Inserts an application note. */
export async function insertNote(applicationId: number, input: NoteInput) {
  const [note] = await db("application_notes").insert({ application_id: applicationId, content: input.content }).returning("*");
  return note;
}

/** Updates a note. */
export async function updateNote(id: number, input: NoteInput) {
  const [note] = await db("application_notes").where({ id }).update({ content: input.content, updated_at: db.fn.now() }).returning("*");
  return note;
}

/** Deletes a note. */
export async function deleteNote(id: number) {
  return db("application_notes").where({ id }).delete();
}

/** Inserts document metadata after Multer stores the file. */
export async function insertDocument(input: { applicationId: number; filename: string; originalName: string; mimeType: string; fileSize: number; filePath: string; documentType: string }) {
  const [document] = await db("documents").insert({ application_id: input.applicationId, filename: input.filename, original_name: input.originalName, mime_type: input.mimeType, file_size: input.fileSize, file_path: input.filePath, document_type: input.documentType }).returning("*");
  return document;
}

/** Finds a document row. */
export async function findDocument(id: number) {
  return db("documents").where({ id }).first();
}

/** Deletes document metadata. */
export async function deleteDocument(id: number) {
  return db("documents").where({ id }).delete();
}

/** Lists contacts for a user. */
export async function findContacts(userId: number) {
  return db("contacts").where({ user_id: userId }).orderBy("name");
}

/** Inserts a contact. */
export async function insertContact(userId: number, input: ContactInput) {
  const [contact] = await db("contacts").insert({ user_id: userId, name: input.name, email: input.email, phone: input.phone, company: input.company, role: input.role, notes: input.notes }).returning("*");
  return contact;
}

/** Updates a contact. */
export async function updateContact(id: number, input: ContactInput) {
  const [contact] = await db("contacts").where({ id }).update(input).returning("*");
  return contact;
}

/** Deletes a contact. */
export async function deleteContact(id: number) {
  return db("contacts").where({ id }).delete();
}

/** Links a contact to an application. */
export async function linkContact(applicationId: number, contactId: number) {
  return db("application_contacts").insert({ application_id: applicationId, contact_id: contactId }).onConflict(["application_id", "contact_id"]).ignore();
}

/** Unlinks a contact from an application. */
export async function unlinkContact(applicationId: number, contactId: number) {
  return db("application_contacts").where({ application_id: applicationId, contact_id: contactId }).delete();
}

/** Lists upcoming reminders. */
export async function findReminders(userId: number) {
  return db("reminders").join("applications", "reminders.application_id", "applications.id").where("reminders.user_id", userId).andWhere("reminders.is_sent", false).select("reminders.*", "applications.company_name", "applications.position_title").orderBy("remind_at").limit(10);
}

/** Inserts a reminder. */
export async function insertReminder(userId: number, input: ReminderInput) {
  const [reminder] = await db("reminders").insert({ user_id: userId, application_id: input.applicationId, remind_at: input.remindAt, message: input.message }).returning("*");
  return reminder;
}

/** Deletes a reminder. */
export async function deleteReminder(id: number) {
  return db("reminders").where({ id }).delete();
}

/** Lists tags. */
export async function findTags(userId: number) {
  return db("tags").where({ user_id: userId }).orderBy("name");
}

/** Inserts a tag. */
export async function insertTag(userId: number, input: TagInput) {
  const [tag] = await db("tags").insert({ user_id: userId, name: input.name, color: input.color }).returning("*");
  return tag;
}

/** Deletes a tag. */
export async function deleteTag(id: number) {
  return db("tags").where({ id }).delete();
}

/** Calculates dashboard KPI stats with CTEs. */
export async function getDashboardStats(userId: number) {
  const { rows } = await db.raw(`
    WITH base AS (
      SELECT a.*, s.name AS stage_name, s.sort_order
      FROM applications a
      JOIN pipeline_stages s ON s.id = a.current_stage_id
      WHERE a.user_id = ?
    ), offer_times AS (
      SELECT a.id, MIN(h.transitioned_at::date - a.applied_date) AS days_to_offer
      FROM applications a
      JOIN stage_history h ON h.application_id = a.id
      JOIN pipeline_stages s ON s.id = h.to_stage_id
      WHERE a.user_id = ? AND s.name = 'Offer'
      GROUP BY a.id
    )
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE stage_name NOT IN ('Accepted','Rejected'))::int AS active,
      ROUND(100.0 * COUNT(*) FILTER (WHERE sort_order > 1) / NULLIF(COUNT(*), 0), 1) AS response_rate,
      ROUND(AVG(days_to_offer), 1) AS avg_days_to_offer
    FROM base LEFT JOIN offer_times USING (id)
  `, [userId, userId]);
  return rows[0];
}

/** Counts applications by stage. */
export async function countByStage(userId: number) {
  return db("pipeline_stages as s").leftJoin("applications as a", function join() { this.on("a.current_stage_id", "s.id").andOn("a.user_id", "s.user_id"); }).where("s.user_id", userId).groupBy("s.id").select("s.name", "s.color", db.raw("COUNT(a.id)::int as count")).orderBy("s.sort_order");
}

/** Counts created applications for recent weeks. */
export async function weeklyActivity(userId: number) {
  return db("applications").where({ user_id: userId }).select(db.raw("date_trunc('week', created_at)::date as week"), db.raw("COUNT(*)::int as count")).groupByRaw("1").orderBy("week", "desc").limit(8);
}

/** Exports applications as simple CSV text. */
export async function exportApplications(userId: number) {
  const rows = await findApplications(userId, {});
  const header = "company,position,stage,applied_date,work_type";
  return [header, ...rows.map((row) => [row.company_name, row.position_title, row.stage_name, row.applied_date, row.work_type].map(csvCell).join(","))].join("\n");
}

/** Converts app input into snake_case database columns. */
function toApplicationRow(userId: number, input: ApplicationInput) {
  return { user_id: userId, company_name: input.companyName, position_title: input.positionTitle, job_url: input.jobUrl, current_stage_id: input.currentStageId, salary_min: input.salaryMin, salary_max: input.salaryMax, salary_currency: input.salaryCurrency ?? "USD", location: input.location, work_type: input.workType, applied_date: input.appliedDate };
}

/** Converts partial input into update columns without user id. */
function toPartialApplicationRow(input: Partial<ApplicationInput>) {
  return { company_name: input.companyName, position_title: input.positionTitle, job_url: input.jobUrl, current_stage_id: input.currentStageId, salary_min: input.salaryMin, salary_max: input.salaryMax, salary_currency: input.salaryCurrency, location: input.location, work_type: input.workType, applied_date: input.appliedDate };
}

/** Escapes a CSV cell. */
function csvCell(value: unknown) {
  const text = String(value ?? "");
  return text.includes(",") ? `"${text.replace(/"/g, '""')}"` : text;
}
'@

Write-ProjectFile "$jobRoot/server/src/services/jobService.ts" @'
import fs from "node:fs/promises";
import nodemailer from "nodemailer";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import * as model from "../models/jobModel.js";
import type { ApplicationInput, ContactInput, NoteInput, ReminderInput, TagInput, TransitionInput } from "../types/index.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

/** Lists applications for the demo user. */
export async function listApplications(filters: Record<string, string | undefined>) {
  return model.findApplications(env.DEMO_USER_ID, filters);
}

/** Creates an application and its initial history row. */
export async function createApplication(input: ApplicationInput) {
  return db.transaction(async (trx) => {
    const [application] = await trx("applications").insert({
      user_id: env.DEMO_USER_ID,
      company_name: input.companyName,
      position_title: input.positionTitle,
      job_url: input.jobUrl,
      current_stage_id: input.currentStageId,
      salary_min: input.salaryMin,
      salary_max: input.salaryMax,
      salary_currency: input.salaryCurrency ?? "USD",
      location: input.location,
      work_type: input.workType,
      applied_date: input.appliedDate
    }).returning("*");
    await trx("stage_history").insert({ application_id: application.id, to_stage_id: input.currentStageId, note: "Application created" });
    return application;
  });
}

/** Gets a full application detail view. */
export async function getApplication(id: number) {
  const detail = await model.findApplicationDetail(env.DEMO_USER_ID, id);
  if (!detail.application) throw new NotFoundError("Application not found");
  return detail;
}

/** Updates application fields. */
export async function updateApplication(id: number, input: Partial<ApplicationInput>) {
  await assertApplication(id);
  return model.updateApplication(id, input);
}

/** Deletes an application. */
export async function removeApplication(id: number) {
  await assertApplication(id);
  await model.deleteApplication(id);
  return { deleted: true };
}

/** Moves an application through the pipeline with state-machine validation. */
export async function transitionApplication(id: number, input: TransitionInput) {
  const application = await assertApplication(id);
  const stages = await model.findStages(env.DEMO_USER_ID);
  const from = stages.find((stage) => stage.id === application.current_stage_id);
  const to = stages.find((stage) => stage.id === input.stageId);
  if (!from || !to) throw new ValidationError("Unknown stage");
  if (from.is_terminal) throw new ValidationError("Terminal applications cannot move");
  if (Math.abs(to.sort_order - from.sort_order) > 1 && !to.is_terminal) throw new ValidationError("Pipeline stages can only move one active step at a time");
  return db.transaction((trx) => model.transitionApplication(trx, { applicationId: id, fromStageId: from.id, toStageId: to.id, note: input.note }));
}

/** Toggles archived state. */
export async function toggleArchive(id: number) {
  await assertApplication(id);
  return model.toggleArchive(id);
}

/** Lists history for an application. */
export async function getHistory(id: number) {
  return (await getApplication(id)).history;
}

/** Adds a note. */
export async function addNote(id: number, input: NoteInput) {
  await assertApplication(id);
  return model.insertNote(id, input);
}

/** Updates a note. */
export async function updateNote(id: number, input: NoteInput) {
  return model.updateNote(id, input);
}

/** Deletes a note. */
export async function deleteNote(id: number) {
  await model.deleteNote(id);
  return { deleted: true };
}

/** Stores uploaded file metadata from Multer. */
export async function saveDocument(applicationId: number, file: Express.Multer.File | undefined, documentType: string) {
  await assertApplication(applicationId);
  if (!file) throw new ValidationError("Document file is required");
  return model.insertDocument({ applicationId, filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size, filePath: file.path, documentType });
}

/** Returns a document for download. */
export async function getDocument(id: number) {
  const document = await model.findDocument(id);
  if (!document) throw new NotFoundError("Document not found");
  return document;
}

/** Deletes document metadata and attempts to remove the local file. */
export async function deleteDocument(id: number) {
  const document = await getDocument(id);
  await model.deleteDocument(id);
  await fs.unlink(document.file_path).catch(() => undefined);
  return { deleted: true };
}

/** Lists contacts. */
export async function listContacts() { return model.findContacts(env.DEMO_USER_ID); }
/** Creates a contact. */
export async function createContact(input: ContactInput) { return model.insertContact(env.DEMO_USER_ID, input); }
/** Updates a contact. */
export async function updateContact(id: number, input: ContactInput) { return model.updateContact(id, input); }
/** Deletes a contact. */
export async function deleteContact(id: number) { await model.deleteContact(id); return { deleted: true }; }
/** Links a contact to an application. */
export async function linkContact(applicationId: number, contactId: number) { await assertApplication(applicationId); await model.linkContact(applicationId, contactId); return { linked: true }; }
/** Unlinks a contact from an application. */
export async function unlinkContact(applicationId: number, contactId: number) { await model.unlinkContact(applicationId, contactId); return { linked: false }; }
/** Lists reminders. */
export async function listReminders() { return model.findReminders(env.DEMO_USER_ID); }
/** Creates a reminder intent. */
export async function createReminder(input: ReminderInput) { await assertApplication(input.applicationId); return model.insertReminder(env.DEMO_USER_ID, input); }
/** Deletes a reminder. */
export async function deleteReminder(id: number) { await model.deleteReminder(id); return { deleted: true }; }
/** Lists stages. */
export async function listStages() { return model.findStages(env.DEMO_USER_ID); }
/** Replaces stages for settings editor. */
export async function updateStages(stages: Array<{ name: string; color: string; sortOrder: number; isTerminal?: boolean }>) { return model.replaceStages(env.DEMO_USER_ID, stages); }
/** Lists tags. */
export async function listTags() { return model.findTags(env.DEMO_USER_ID); }
/** Creates a tag. */
export async function createTag(input: TagInput) { return model.insertTag(env.DEMO_USER_ID, input); }
/** Deletes a tag. */
export async function deleteTag(id: number) { await model.deleteTag(id); return { deleted: true }; }
/** Returns dashboard KPI stats. */
export async function dashboardStats() { return model.getDashboardStats(env.DEMO_USER_ID); }
/** Returns applications by stage. */
export async function dashboardByStage() { return model.countByStage(env.DEMO_USER_ID); }
/** Returns weekly application activity. */
export async function dashboardWeeklyActivity() { return model.weeklyActivity(env.DEMO_USER_ID); }
/** Returns CSV export text. */
export async function exportCsv() { return model.exportApplications(env.DEMO_USER_ID); }

/** Sends a reminder email digest through Nodemailer when a worker invokes it. */
export async function sendReminderDigest(to: string) {
  const transporter = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: false });
  const reminders = await listReminders();
  return transporter.sendMail({ from: env.SMTP_FROM, to, subject: "Job follow-up reminders", text: reminders.map((item) => `${item.company_name}: ${item.message}`).join("\n") });
}

/** Ensures an application belongs to the demo user. */
async function assertApplication(id: number) {
  const application = await model.findApplication(env.DEMO_USER_ID, id);
  if (!application) throw new NotFoundError("Application not found");
  return application;
}
'@

Write-ProjectFile "$jobRoot/server/src/controllers/jobController.ts" @'
import type { RequestHandler } from "express";
import { sendSuccess } from "../utils/response.js";
import * as service from "../services/jobService.js";

const id = (value: string) => Number(value);

export const listApplications: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.listApplications(req.query as Record<string, string | undefined>)); } catch (error) { next(error); } };
export const getApplication: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.getApplication(id(req.params.id))); } catch (error) { next(error); } };
export const createApplication: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.createApplication(req.body), 201); } catch (error) { next(error); } };
export const updateApplication: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.updateApplication(id(req.params.id), req.body)); } catch (error) { next(error); } };
export const deleteApplication: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.removeApplication(id(req.params.id))); } catch (error) { next(error); } };
export const transitionApplication: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.transitionApplication(id(req.params.id), req.body)); } catch (error) { next(error); } };
export const archiveApplication: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.toggleArchive(id(req.params.id))); } catch (error) { next(error); } };
export const getHistory: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.getHistory(id(req.params.id))); } catch (error) { next(error); } };
export const addNote: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.addNote(id(req.params.id), req.body), 201); } catch (error) { next(error); } };
export const updateNote: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.updateNote(id(req.params.id), req.body)); } catch (error) { next(error); } };
export const deleteNote: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.deleteNote(id(req.params.id))); } catch (error) { next(error); } };
export const uploadDocument: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.saveDocument(id(req.params.id), req.file, req.body.documentType ?? "other"), 201); } catch (error) { next(error); } };
export const downloadDocument: RequestHandler = async (req, res, next) => { try { const document = await service.getDocument(id(req.params.id)); res.download(document.file_path, document.original_name); } catch (error) { next(error); } };
export const deleteDocument: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.deleteDocument(id(req.params.id))); } catch (error) { next(error); } };
export const listContacts: RequestHandler = async (_req, res, next) => { try { sendSuccess(res, await service.listContacts()); } catch (error) { next(error); } };
export const createContact: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.createContact(req.body), 201); } catch (error) { next(error); } };
export const updateContact: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.updateContact(id(req.params.id), req.body)); } catch (error) { next(error); } };
export const deleteContact: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.deleteContact(id(req.params.id))); } catch (error) { next(error); } };
export const linkContact: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.linkContact(id(req.params.id), id(req.params.contactId))); } catch (error) { next(error); } };
export const unlinkContact: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.unlinkContact(id(req.params.id), id(req.params.contactId))); } catch (error) { next(error); } };
export const listReminders: RequestHandler = async (_req, res, next) => { try { sendSuccess(res, await service.listReminders()); } catch (error) { next(error); } };
export const createReminder: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.createReminder(req.body), 201); } catch (error) { next(error); } };
export const deleteReminder: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.deleteReminder(id(req.params.id))); } catch (error) { next(error); } };
export const listStages: RequestHandler = async (_req, res, next) => { try { sendSuccess(res, await service.listStages()); } catch (error) { next(error); } };
export const updateStages: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.updateStages(req.body.stages)); } catch (error) { next(error); } };
export const dashboardStats: RequestHandler = async (_req, res, next) => { try { sendSuccess(res, await service.dashboardStats()); } catch (error) { next(error); } };
export const dashboardByStage: RequestHandler = async (_req, res, next) => { try { sendSuccess(res, await service.dashboardByStage()); } catch (error) { next(error); } };
export const dashboardWeekly: RequestHandler = async (_req, res, next) => { try { sendSuccess(res, await service.dashboardWeeklyActivity()); } catch (error) { next(error); } };
export const exportApplications: RequestHandler = async (_req, res, next) => { try { res.type("text/csv").send(await service.exportCsv()); } catch (error) { next(error); } };
export const listTags: RequestHandler = async (_req, res, next) => { try { sendSuccess(res, await service.listTags()); } catch (error) { next(error); } };
export const createTag: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.createTag(req.body), 201); } catch (error) { next(error); } };
export const deleteTag: RequestHandler = async (req, res, next) => { try { sendSuccess(res, await service.deleteTag(id(req.params.id))); } catch (error) { next(error); } };
'@

Write-ProjectFile "$jobRoot/server/src/routes/jobRoutes.ts" @'
import fs from "node:fs";
import multer from "multer";
import { Router } from "express";
import { env } from "../config/env.js";
import * as controller from "../controllers/jobController.js";
import { validateBody } from "../middleware/validate.js";
import { applicationSchema, contactSchema, noteSchema, reminderSchema, tagSchema, transitionSchema } from "../validators/jobValidators.js";

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: env.UPLOAD_DIR,
    filename: (_req, file, callback) => callback(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"];
    callback(null, allowed.includes(file.mimetype));
  }
});

export const jobRouter = Router();
jobRouter.get("/applications/export", controller.exportApplications);
jobRouter.get("/applications", controller.listApplications);
jobRouter.get("/applications/:id", controller.getApplication);
jobRouter.post("/applications", validateBody(applicationSchema), controller.createApplication);
jobRouter.put("/applications/:id", validateBody(applicationSchema.partial()), controller.updateApplication);
jobRouter.delete("/applications/:id", controller.deleteApplication);
jobRouter.post("/applications/:id/transition", validateBody(transitionSchema), controller.transitionApplication);
jobRouter.patch("/applications/:id/archive", controller.archiveApplication);
jobRouter.get("/applications/:id/history", controller.getHistory);
jobRouter.post("/applications/:id/notes", validateBody(noteSchema), controller.addNote);
jobRouter.put("/notes/:id", validateBody(noteSchema), controller.updateNote);
jobRouter.delete("/notes/:id", controller.deleteNote);
jobRouter.post("/applications/:id/documents", upload.single("document"), controller.uploadDocument);
jobRouter.get("/documents/:id/download", controller.downloadDocument);
jobRouter.delete("/documents/:id", controller.deleteDocument);
jobRouter.get("/contacts", controller.listContacts);
jobRouter.post("/contacts", validateBody(contactSchema), controller.createContact);
jobRouter.put("/contacts/:id", validateBody(contactSchema), controller.updateContact);
jobRouter.delete("/contacts/:id", controller.deleteContact);
jobRouter.post("/applications/:id/contacts/:contactId", controller.linkContact);
jobRouter.delete("/applications/:id/contacts/:contactId", controller.unlinkContact);
jobRouter.get("/reminders", controller.listReminders);
jobRouter.post("/reminders", validateBody(reminderSchema), controller.createReminder);
jobRouter.delete("/reminders/:id", controller.deleteReminder);
jobRouter.get("/pipeline-stages", controller.listStages);
jobRouter.put("/pipeline-stages", controller.updateStages);
jobRouter.get("/dashboard/stats", controller.dashboardStats);
jobRouter.get("/dashboard/by-stage", controller.dashboardByStage);
jobRouter.get("/dashboard/weekly-activity", controller.dashboardWeekly);
jobRouter.get("/tags", controller.listTags);
jobRouter.post("/tags", validateBody(tagSchema), controller.createTag);
jobRouter.delete("/tags/:id", controller.deleteTag);
'@

Write-ProjectFile "$jobRoot/server/src/app.ts" @'
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { jobRouter } from "./routes/jobRoutes.js";

/** Creates the Express app for the job tracker. */
export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json());
  app.use(morgan("dev"));
  app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));
  app.use("/api", jobRouter);
  app.use(errorMiddleware);
  return app;
}
'@

Write-ProjectFile "$jobRoot/server/src/server.ts" @'
import { createApp } from "./app.js";
import { env } from "./config/env.js";

/** Starts the job tracker API server. */
function startServer() {
  createApp().listen(env.PORT, () => console.log(`Job tracker API listening on ${env.PORT}`));
}

startServer();
'@

Write-ProjectFile "$jobRoot/server/db/migrations/001_create_job_tracker_tables.ts" @'
import type { Knex } from "knex";

/** Creates all Project 9 tables. */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("email", 255).notNullable().unique();
    table.string("name", 100).notNullable();
    table.timestamps(true, true);
  });
  await knex.schema.createTable("pipeline_stages", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("name", 50).notNullable();
    table.string("color", 7).notNullable();
    table.integer("sort_order").notNullable();
    table.boolean("is_terminal").notNullable().defaultTo(false);
    table.unique(["user_id", "name"]);
  });
  await knex.schema.createTable("applications", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("company_name", 200).notNullable();
    table.string("position_title", 200).notNullable();
    table.string("job_url", 2000);
    table.integer("current_stage_id").notNullable().references("id").inTable("pipeline_stages");
    table.integer("salary_min");
    table.integer("salary_max");
    table.string("salary_currency", 3).defaultTo("USD");
    table.string("location", 200);
    table.string("work_type", 20).notNullable().defaultTo("remote");
    table.date("applied_date").notNullable();
    table.boolean("is_archived").notNullable().defaultTo(false);
    table.timestamps(true, true);
    table.check("?? in ('remote','hybrid','onsite')", ["work_type"]);
  });
  await knex.schema.createTable("stage_history", (table) => {
    table.increments("id").primary();
    table.integer("application_id").notNullable().references("id").inTable("applications").onDelete("CASCADE");
    table.integer("from_stage_id").references("id").inTable("pipeline_stages");
    table.integer("to_stage_id").notNullable().references("id").inTable("pipeline_stages");
    table.text("note");
    table.timestamp("transitioned_at").notNullable().defaultTo(knex.fn.now());
  });
  await knex.schema.createTable("application_notes", (table) => {
    table.increments("id").primary();
    table.integer("application_id").notNullable().references("id").inTable("applications").onDelete("CASCADE");
    table.text("content").notNullable();
    table.timestamps(true, true);
  });
  await knex.schema.createTable("documents", (table) => {
    table.increments("id").primary();
    table.integer("application_id").notNullable().references("id").inTable("applications").onDelete("CASCADE");
    table.string("filename", 255).notNullable();
    table.string("original_name", 255).notNullable();
    table.string("mime_type", 100).notNullable();
    table.integer("file_size").notNullable();
    table.string("file_path", 500).notNullable();
    table.string("document_type", 30).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.check("?? in ('resume','cover_letter','portfolio','other')", ["document_type"]);
  });
  await knex.schema.createTable("contacts", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("name", 100).notNullable();
    table.string("email", 255);
    table.string("phone", 30);
    table.string("company", 200);
    table.string("role", 100);
    table.text("notes");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
  await knex.schema.createTable("application_contacts", (table) => {
    table.integer("application_id").notNullable().references("id").inTable("applications").onDelete("CASCADE");
    table.integer("contact_id").notNullable().references("id").inTable("contacts").onDelete("CASCADE");
    table.primary(["application_id", "contact_id"]);
  });
  await knex.schema.createTable("reminders", (table) => {
    table.increments("id").primary();
    table.integer("application_id").notNullable().references("id").inTable("applications").onDelete("CASCADE");
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.timestamp("remind_at").notNullable();
    table.string("message", 500).notNullable();
    table.boolean("is_sent").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
  await knex.schema.createTable("tags", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("name", 50).notNullable();
    table.string("color", 7).notNullable();
    table.unique(["user_id", "name"]);
  });
  await knex.schema.createTable("application_tags", (table) => {
    table.integer("application_id").notNullable().references("id").inTable("applications").onDelete("CASCADE");
    table.integer("tag_id").notNullable().references("id").inTable("tags").onDelete("CASCADE");
    table.primary(["application_id", "tag_id"]);
  });
}

/** Drops Project 9 tables in reverse dependency order. */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("application_tags");
  await knex.schema.dropTableIfExists("tags");
  await knex.schema.dropTableIfExists("reminders");
  await knex.schema.dropTableIfExists("application_contacts");
  await knex.schema.dropTableIfExists("contacts");
  await knex.schema.dropTableIfExists("documents");
  await knex.schema.dropTableIfExists("application_notes");
  await knex.schema.dropTableIfExists("stage_history");
  await knex.schema.dropTableIfExists("applications");
  await knex.schema.dropTableIfExists("pipeline_stages");
  await knex.schema.dropTableIfExists("users");
}
'@

Write-ProjectFile "$jobRoot/server/db/seeds/001_seed_job_tracker.ts" @'
import type { Knex } from "knex";

/** Seeds users, stages, applications, history, documents, contacts, reminders, and tags. */
export async function seed(knex: Knex): Promise<void> {
  for (const table of ["application_tags", "tags", "reminders", "application_contacts", "contacts", "documents", "application_notes", "stage_history", "applications", "pipeline_stages", "users"]) await knex(table).del();
  const users = await knex("users").insert([{ email: "jordan@example.com", name: "Jordan Parker" }, { email: "sam@example.com", name: "Sam Rivera" }]).returning("*");
  const defaults = ["Applied", "Phone Screen", "Technical Interview", "Onsite", "Offer", "Accepted", "Rejected"];
  const stageRows = [];
  for (const user of users) {
    stageRows.push(...defaults.map((name, index) => ({ user_id: user.id, name, color: ["#64748b", "#0891b2", "#7c3aed", "#2563eb", "#ca8a04", "#16a34a", "#dc2626"][index], sort_order: index + 1, is_terminal: ["Accepted", "Rejected"].includes(name) })));
  }
  const stages = await knex("pipeline_stages").insert(stageRows).returning("*");
  const tags = await knex("tags").insert(["Dream Job", "Backup", "FAANG", "Remote", "Referral"].flatMap((name, index) => users.map((user) => ({ user_id: user.id, name, color: ["#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#f97316"][index] })))).returning("*");
  const contacts = await knex("contacts").insert(Array.from({ length: 10 }, (_, index) => ({ user_id: users[index % 2].id, name: `Recruiter ${index + 1}`, email: `recruiter${index + 1}@example.com`, company: `Company ${index + 1}`, role: "Technical Recruiter" }))).returning("*");
  for (let index = 0; index < 30; index++) {
    const user = users[index % users.length];
    const userStages = stages.filter((stage) => stage.user_id === user.id);
    const stage = userStages[index % userStages.length];
    const [app] = await knex("applications").insert({ user_id: user.id, company_name: `Company ${index + 1}`, position_title: ["Frontend Engineer", "Full Stack Developer", "Platform Engineer"][index % 3], current_stage_id: stage.id, salary_min: 95000 + index * 1000, salary_max: 125000 + index * 1200, location: index % 2 ? "Remote" : "Seattle, WA", work_type: ["remote", "hybrid", "onsite"][index % 3], applied_date: knex.raw(`CURRENT_DATE - INTERVAL '${index + 2} days'`) }).returning("*");
    for (const historyStage of userStages.filter((item) => item.sort_order <= stage.sort_order).slice(0, 5)) await knex("stage_history").insert({ application_id: app.id, to_stage_id: historyStage.id, note: `Moved to ${historyStage.name}`, transitioned_at: knex.raw(`NOW() - INTERVAL '${index + historyStage.sort_order} days'`) });
    await knex("application_notes").insert({ application_id: app.id, content: "Tailored resume and tracked next follow-up." });
    await knex("documents").insert({ application_id: app.id, filename: `placeholder-${app.id}.pdf`, original_name: "resume.pdf", mime_type: "application/pdf", file_size: 2048, file_path: `uploads/placeholder-${app.id}.pdf`, document_type: "resume" });
    await knex("application_contacts").insert({ application_id: app.id, contact_id: contacts[index % contacts.length].id });
    await knex("application_tags").insert({ application_id: app.id, tag_id: tags[index % tags.length].id });
    if (index < 12) await knex("reminders").insert({ application_id: app.id, user_id: user.id, remind_at: knex.raw(`NOW() + INTERVAL '${index + 1} days'`), message: "Send polite follow-up email." });
  }
}
'@

Write-ProjectFile "$jobRoot/client/package.json" @'
{
  "name": "09-job-application-tracker-client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5179",
    "build": "tsc && vite build",
    "preview": "vite preview --host 0.0.0.0"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.62.8",
    "axios": "^1.7.9",
    "date-fns": "^4.1.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.7"
  }
}
'@

Write-ProjectFile "$jobRoot/client/tsconfig.json" @'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "jsx": "react-jsx",
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
'@

Write-ProjectFile "$jobRoot/client/vite.config.ts" @'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({ plugins: [react()] });
'@

Write-ProjectFile "$jobRoot/client/index.html" @'
<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Job Tracker</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
'@

Write-ProjectFile "$jobRoot/client/src/types/index.ts" @'
export interface Stage { id: number; name: string; color: string; sort_order: number; is_terminal: boolean }
export interface Application { id: number; company_name: string; position_title: string; stage_name: string; stage_color: string; applied_date: string; work_type: string; salary_min?: number; salary_max?: number }
export interface DashboardStats { total: number; active: number; response_rate: string; avg_days_to_offer: string | null }
export interface Reminder { id: number; company_name: string; position_title: string; remind_at: string; message: string }
'@

Write-ProjectFile "$jobRoot/client/src/services/api.ts" @'
import axios from "axios";
import type { Application, DashboardStats, Reminder, Stage } from "../types";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4109/api" });

/** Unwraps the API response envelope. */
function unwrap<T>(response: { data: { data: T } }): T { return response.data.data; }
/** Fetches applications. */
export async function fetchApplications() { return unwrap<Application[]>(await api.get("/applications")); }
/** Fetches pipeline stages. */
export async function fetchStages() { return unwrap<Stage[]>(await api.get("/pipeline-stages")); }
/** Fetches dashboard KPIs. */
export async function fetchStats() { return unwrap<DashboardStats>(await api.get("/dashboard/stats")); }
/** Fetches counts by stage. */
export async function fetchByStage() { return unwrap<Array<{ name: string; color: string; count: number }>>(await api.get("/dashboard/by-stage")); }
/** Fetches weekly activity. */
export async function fetchWeekly() { return unwrap<Array<{ week: string; count: number }>>(await api.get("/dashboard/weekly-activity")); }
/** Fetches reminders. */
export async function fetchReminders() { return unwrap<Reminder[]>(await api.get("/reminders")); }
/** Creates an application. */
export async function createApplication(input: { companyName: string; positionTitle: string; currentStageId: number; workType: string; appliedDate: string }) { return unwrap(await api.post("/applications", input)); }
/** Transitions an application to another stage. */
export async function transitionApplication(applicationId: number, stageId: number) { return unwrap(await api.post(`/applications/${applicationId}/transition`, { stageId, note: "Moved from dashboard" })); }
'@

Write-ProjectFile "$jobRoot/client/src/components/ui/Button.tsx" @'
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import styles from "./Button.module.css";

/** Shared compact button component. */
export function Button({ children, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return <button className={styles.button} {...props}>{children}</button>;
}
'@

Write-ProjectFile "$jobRoot/client/src/components/ui/Button.module.css" @'
.button { border: 0; border-radius: 6px; background: #155e75; color: white; padding: 0.6rem 0.85rem; font-weight: 800; cursor: pointer; }
.button:disabled { opacity: 0.55; }
'@

Write-ProjectFile "$jobRoot/client/src/pages/TrackerPage.tsx" @'
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { createApplication, fetchApplications, fetchByStage, fetchReminders, fetchStages, fetchStats, fetchWeekly, transitionApplication } from "../services/api";
import styles from "./Tracker.module.css";

/** Main job tracker dashboard with KPIs, pipeline, reminders, and table actions. */
export function TrackerPage() {
  const queryClient = useQueryClient();
  const apps = useQuery({ queryKey: ["applications"], queryFn: fetchApplications });
  const stages = useQuery({ queryKey: ["stages"], queryFn: fetchStages });
  const stats = useQuery({ queryKey: ["stats"], queryFn: fetchStats });
  const byStage = useQuery({ queryKey: ["by-stage"], queryFn: fetchByStage });
  const weekly = useQuery({ queryKey: ["weekly"], queryFn: fetchWeekly });
  const reminders = useQuery({ queryKey: ["reminders"], queryFn: fetchReminders });
  const create = useMutation({
    mutationFn: () => createApplication({ companyName: "Northstar Labs", positionTitle: "Product Engineer", currentStageId: stages.data?.[0]?.id ?? 1, workType: "remote", appliedDate: new Date().toISOString().slice(0, 10) }),
    onSuccess: () => queryClient.invalidateQueries()
  });
  const transition = useMutation({ mutationFn: ({ id, stageId }: { id: number; stageId: number }) => transitionApplication(id, stageId), onSuccess: () => queryClient.invalidateQueries() });

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Project 9</p><h1>Job application tracker</h1></div>
        <Button onClick={() => create.mutate()}>Add application</Button>
      </header>
      <section className={styles.stats}>
        <article><span>Total</span><strong>{stats.data?.total ?? 0}</strong></article>
        <article><span>Active</span><strong>{stats.data?.active ?? 0}</strong></article>
        <article><span>Response rate</span><strong>{stats.data?.response_rate ?? 0}%</strong></article>
        <article><span>Avg days to offer</span><strong>{stats.data?.avg_days_to_offer ?? "n/a"}</strong></article>
      </section>
      <section className={styles.grid}>
        <article className={styles.panel}>
          <h2>Pipeline</h2>
          {byStage.data?.map((stage) => <div key={stage.name} className={styles.stage}><i style={{ background: stage.color, width: `${Math.max(stage.count * 12, 12)}px` }} /><span>{stage.name}</span><b>{stage.count}</b></div>)}
        </article>
        <article className={styles.panel}>
          <h2>Weekly activity</h2>
          {weekly.data?.map((week) => <div key={week.week} className={styles.bar}><span>{new Date(week.week).toLocaleDateString()}</span><i style={{ width: `${Math.max(week.count * 18, 10)}px` }} /><b>{week.count}</b></div>)}
        </article>
        <article className={styles.panel}>
          <h2>Reminders</h2>
          {reminders.data?.slice(0, 5).map((reminder) => <p key={reminder.id}><b>{reminder.company_name}</b><br />{reminder.message}</p>)}
        </article>
      </section>
      <section className={styles.panel}>
        <h2>Applications</h2>
        <table>
          <thead><tr><th>Company</th><th>Role</th><th>Stage</th><th>Work</th><th>Move</th></tr></thead>
          <tbody>{apps.data?.map((app) => {
            const next = stages.data?.find((stage) => stage.sort_order === (stages.data?.find((item) => item.name === app.stage_name)?.sort_order ?? 0) + 1);
            return <tr key={app.id}><td>{app.company_name}</td><td>{app.position_title}</td><td><span className={styles.badge} style={{ background: app.stage_color }}>{app.stage_name}</span></td><td>{app.work_type}</td><td>{next && <Button onClick={() => transition.mutate({ id: app.id, stageId: next.id })}>Next</Button>}</td></tr>;
          })}</tbody>
        </table>
      </section>
    </main>
  );
}
'@

Write-ProjectFile "$jobRoot/client/src/pages/Tracker.module.css" @'
.shell { min-height: 100vh; padding: 2rem; background: #f8fafc; color: #172033; }
.header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
.eyebrow { margin: 0; color: #0e7490; font-weight: 800; text-transform: uppercase; font-size: 0.75rem; }
h1, h2 { margin: 0; }
.stats { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.stats article, .panel { background: white; border: 1px solid #dbe3ef; border-radius: 8px; padding: 1rem; }
.stats span { display: block; color: #64748b; font-weight: 700; }
.stats strong { font-size: 1.8rem; }
.grid { display: grid; grid-template-columns: 1.1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.stage, .bar { display: grid; grid-template-columns: minmax(30px, 1fr) 1fr auto; align-items: center; gap: 0.65rem; margin: 0.75rem 0; }
.stage i, .bar i { display: block; height: 12px; border-radius: 999px; background: #0891b2; }
table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #e2e8f0; }
.badge { display: inline-block; color: white; border-radius: 999px; padding: 0.25rem 0.55rem; font-size: 0.8rem; font-weight: 800; }
@media (max-width: 900px) { .stats, .grid { grid-template-columns: 1fr; } }
'@

Write-ProjectFile "$jobRoot/client/src/App.tsx" @'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TrackerPage } from "./pages/TrackerPage";

const queryClient = new QueryClient();

/** Provides React Query and renders the job tracker workspace. */
export function App() {
  return <QueryClientProvider client={queryClient}><TrackerPage /></QueryClientProvider>;
}
'@

Write-ProjectFile "$jobRoot/client/src/main.tsx" @'
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
'@

Write-ProjectFile "$jobRoot/client/src/index.css" @'
:root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #172033; }
* { box-sizing: border-box; }
body { margin: 0; }
button, input, select, textarea { font: inherit; }
'@
