CREATE TABLE `checklist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`declaracion_id` text NOT NULL,
	`titulo` text NOT NULL,
	`descripcion` text,
	`tipo` text NOT NULL,
	`completado` integer DEFAULT false NOT NULL,
	`completado_por_id` text,
	`fecha_completado` integer,
	`orden` integer DEFAULT 0 NOT NULL,
	`obligatorio` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`declaracion_id`) REFERENCES `declaraciones_mensuales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`completado_por_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `comentarios` (
	`id` text PRIMARY KEY NOT NULL,
	`declaracion_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`mensaje` text NOT NULL,
	`archivo_adjunto_url` text,
	`archivo_adjunto_nombre` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`declaracion_id`) REFERENCES `declaraciones_mensuales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `declaraciones_mensuales` (
	`id` text PRIMARY KEY NOT NULL,
	`contribuyente_id` text NOT NULL,
	`contador_id` text NOT NULL,
	`mes` integer NOT NULL,
	`anio` integer NOT NULL,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`color_estado` text DEFAULT 'rojo' NOT NULL,
	`paso_actual` integer DEFAULT 1 NOT NULL,
	`total_pasos` integer DEFAULT 4 NOT NULL,
	`fecha_limite` integer,
	`fecha_enviada` integer,
	`monto_total` real DEFAULT 0,
	`impuesto_calculado` real DEFAULT 0,
	`archivo_url` text,
	`observaciones` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`contribuyente_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contador_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `facturas` (
	`id` text PRIMARY KEY NOT NULL,
	`declaracion_id` text NOT NULL,
	`contribuyente_id` text NOT NULL,
	`tipo_documento` text NOT NULL,
	`nombre_archivo` text NOT NULL,
	`archivo_url` text NOT NULL,
	`tamano_bytes` integer,
	`mime_type` text,
	`folio` text,
	`rfc_emisor` text,
	`monto` real,
	`iva` real,
	`fecha_emision` integer,
	`categoria` text,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`notas` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`declaracion_id`) REFERENCES `declaraciones_mensuales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contribuyente_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notificaciones` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`tipo` text NOT NULL,
	`titulo` text NOT NULL,
	`mensaje` text NOT NULL,
	`leido` integer DEFAULT false NOT NULL,
	`enlace` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`hashed_password` text NOT NULL,
	`nombre` text NOT NULL,
	`apellidos` text NOT NULL,
	`telefono` text,
	`rfc` text,
	`rol` text NOT NULL,
	`avatar_url` text,
	`despacho` text,
	`regimen_fiscal` text,
	`contador_asignado_id` text,
	`activo` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`contador_asignado_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);