/*
  Schema bazy danych aplikacji obsługi siłowni.
  Wersja uproszczona do uruchamiania w istniejącej bazie gym_reservation.
  Usunięto sekcję CREATE DATABASE / ALTER DATABASE generowaną przez SSMS,
  ponieważ WebStorm często oznacza ją jako błędną składniowo dla SQL Server 2022.
*/

USE [gym_reservation]
GO
/****** Object:  Table [dbo].[Equipment]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Equipment](
	[EquipmentId] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](150) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[Quantity] [int] NOT NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[Category] [nvarchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[EquipmentId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EquipmentAlternatives]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EquipmentAlternatives](
	[EquipmentId] [int] NOT NULL,
	[AlternativeEquipmentId] [int] NOT NULL,
 CONSTRAINT [PK_EquipmentAlternatives] PRIMARY KEY CLUSTERED 
(
	[EquipmentId] ASC,
	[AlternativeEquipmentId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EquipmentExercises]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EquipmentExercises](
	[EquipmentId] [int] NOT NULL,
	[ExerciseId] [int] NOT NULL,
	[IsDefault] [bit] NOT NULL,
	[Notes] [nvarchar](max) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_EquipmentExercises] PRIMARY KEY CLUSTERED 
(
	[EquipmentId] ASC,
	[ExerciseId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[EquipmentMuscles]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[EquipmentMuscles](
	[EquipmentId] [int] NOT NULL,
	[MuscleId] [int] NOT NULL,
	[Role] [nvarchar](30) NOT NULL,
	[ActivationLevel] [tinyint] NOT NULL,
	[Notes] [nvarchar](max) NULL,
	[SourceName] [nvarchar](255) NULL,
	[SourceUrl] [nvarchar](500) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_EquipmentMuscles] PRIMARY KEY CLUSTERED 
(
	[EquipmentId] ASC,
	[MuscleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ExerciseMuscles]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ExerciseMuscles](
	[ExerciseId] [int] NOT NULL,
	[MuscleId] [int] NOT NULL,
	[Role] [nvarchar](50) NOT NULL,
	[ActivationLevel] [tinyint] NOT NULL,
	[Notes] [nvarchar](max) NULL,
	[SourceName] [nvarchar](200) NULL,
	[SourceUrl] [nvarchar](500) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_ExerciseMuscles] PRIMARY KEY CLUSTERED 
(
	[ExerciseId] ASC,
	[MuscleId] ASC,
	[Role] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Exercises]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Exercises](
	[ExerciseId] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](150) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[ExerciseType] [nvarchar](50) NOT NULL,
	[TimerMode] [nvarchar](50) NOT NULL,
	[DefaultSets] [int] NULL,
	[DefaultRepetitions] [int] NULL,
	[DefaultDurationSeconds] [int] NULL,
	[DefaultRestSeconds] [int] NOT NULL,
	[DefaultSeriesDurationSeconds] [int] NOT NULL,
	[DifficultyLevel] [nvarchar](50) NOT NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NULL,
 CONSTRAINT [PK_Exercises] PRIMARY KEY CLUSTERED 
(
	[ExerciseId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Muscles]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Muscles](
	[MuscleId] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](100) NOT NULL,
	[MuscleGroup] [nvarchar](100) NOT NULL,
	[LatinName] [nvarchar](150) NULL,
	[Description] [nvarchar](max) NULL,
	[BodyPart] [nvarchar](100) NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[MuscleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Reservations]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Reservations](
	[ReservationId] [int] IDENTITY(1,1) NOT NULL,
	[UserId] [int] NOT NULL,
	[EquipmentId] [int] NOT NULL,
	[TimeSlotId] [int] NOT NULL,
	[ReservationDate] [date] NOT NULL,
	[Status] [nvarchar](20) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[CancelledAt] [datetime2](7) NULL,
	[WorkoutSessionId] [int] NULL,
	[WorkoutPlanItemId] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[ReservationId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ReservationTimeSlots]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ReservationTimeSlots](
	[ReservationId] [int] NOT NULL,
	[TimeSlotId] [int] NOT NULL,
 CONSTRAINT [PK_ReservationTimeSlots] PRIMARY KEY CLUSTERED 
(
	[ReservationId] ASC,
	[TimeSlotId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Roles]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Roles](
	[RoleId] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[RoleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TimeSlots]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TimeSlots](
	[TimeSlotId] [int] IDENTITY(1,1) NOT NULL,
	[StartTime] [time](7) NOT NULL,
	[EndTime] [time](7) NOT NULL,
	[IsActive] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[TimeSlotId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_TimeSlots_StartEnd] UNIQUE NONCLUSTERED 
(
	[StartTime] ASC,
	[EndTime] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Users]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Users](
	[UserId] [int] IDENTITY(1,1) NOT NULL,
	[RoleId] [int] NOT NULL,
	[Email] [nvarchar](255) NOT NULL,
	[PasswordHash] [nvarchar](255) NOT NULL,
	[FullName] [nvarchar](255) NOT NULL,
	[IsActive] [bit] NOT NULL,
    [MustChangePassword] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[WorkoutPlanItems]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[WorkoutPlanItems](
	[WorkoutPlanItemId] [int] IDENTITY(1,1) NOT NULL,
	[WorkoutPlanId] [int] NOT NULL,
	[EquipmentId] [int] NOT NULL,
	[ExerciseName] [nvarchar](150) NOT NULL,
	[OrderNumber] [int] NOT NULL,
	[Sets] [int] NULL,
	[Repetitions] [int] NULL,
	[DurationSeconds] [int] NOT NULL,
	[RestSeconds] [int] NOT NULL,
	[ExerciseType] [nvarchar](30) NOT NULL,
	[TimerMode] [nvarchar](30) NOT NULL,
	[AutoAdvance] [bit] NOT NULL,
	[WeightKg] [decimal](6, 2) NULL,
	[DistanceMeters] [int] NULL,
	[Rpe] [tinyint] NULL,
	[Notes] [nvarchar](max) NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NULL,
	[SeriesDurationSeconds] [int] NOT NULL,
	[ExerciseId] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[WorkoutPlanItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_WorkoutPlanItems_Order] UNIQUE NONCLUSTERED 
(
	[WorkoutPlanId] ASC,
	[OrderNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[WorkoutPlans]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[WorkoutPlans](
	[WorkoutPlanId] [int] IDENTITY(1,1) NOT NULL,
	[UserId] [int] NOT NULL,
	[Name] [nvarchar](150) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[Goal] [nvarchar](50) NOT NULL,
	[DifficultyLevel] [nvarchar](30) NOT NULL,
	[EstimatedDurationSeconds] [int] NULL,
	[IsActive] [bit] NOT NULL,
	[UpdatedAt] [datetime2](7) NULL,
	[IsTemplate] [bit] NOT NULL,
	[IsSystemGenerated] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[WorkoutPlanId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[WorkoutSessions]    Script Date: 6/27/2026 1:06:24 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[WorkoutSessions](
	[WorkoutSessionId] [int] IDENTITY(1,1) NOT NULL,
	[UserId] [int] NOT NULL,
	[WorkoutPlanId] [int] NOT NULL,
	[SessionDate] [date] NOT NULL,
	[StartTime] [time](7) NOT NULL,
	[EndTime] [time](7) NULL,
	[Status] [nvarchar](30) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[WorkoutSessionId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_EquipmentMuscles_EquipmentRole]    Script Date: 6/27/2026 1:06:24 AM ******/
CREATE NONCLUSTERED INDEX [IX_EquipmentMuscles_EquipmentRole] ON [dbo].[EquipmentMuscles]
(
	[EquipmentId] ASC,
	[Role] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_EquipmentMuscles_MuscleId]    Script Date: 6/27/2026 1:06:24 AM ******/
CREATE NONCLUSTERED INDEX [IX_EquipmentMuscles_MuscleId] ON [dbo].[EquipmentMuscles]
(
	[MuscleId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UX_Exercises_Name]    Script Date: 6/27/2026 1:06:24 AM ******/
CREATE UNIQUE NONCLUSTERED INDEX [UX_Exercises_Name] ON [dbo].[Exercises]
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Reservations_Availability]    Script Date: 6/27/2026 1:06:24 AM ******/
CREATE NONCLUSTERED INDEX [IX_Reservations_Availability] ON [dbo].[Reservations]
(
	[EquipmentId] ASC,
	[ReservationDate] ASC,
	[TimeSlotId] ASC,
	[Status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UX_Reservations_UserActiveDuplicate]    Script Date: 6/27/2026 1:06:24 AM ******/
CREATE UNIQUE NONCLUSTERED INDEX [UX_Reservations_UserActiveDuplicate] ON [dbo].[Reservations]
(
	[UserId] ASC,
	[EquipmentId] ASC,
	[ReservationDate] ASC,
	[TimeSlotId] ASC
)
WHERE ([Status]='active')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_WorkoutPlanItems_EquipmentId]    Script Date: 6/27/2026 1:06:24 AM ******/
CREATE NONCLUSTERED INDEX [IX_WorkoutPlanItems_EquipmentId] ON [dbo].[WorkoutPlanItems]
(
	[EquipmentId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_WorkoutPlanItems_PlanOrder]    Script Date: 6/27/2026 1:06:24 AM ******/
CREATE NONCLUSTERED INDEX [IX_WorkoutPlanItems_PlanOrder] ON [dbo].[WorkoutPlanItems]
(
	[WorkoutPlanId] ASC,
	[OrderNumber] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_WorkoutPlans_UserActive]    Script Date: 6/27/2026 1:06:24 AM ******/
CREATE NONCLUSTERED INDEX [IX_WorkoutPlans_UserActive] ON [dbo].[WorkoutPlans]
(
	[UserId] ASC,
	[IsActive] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Equipment] ADD  CONSTRAINT [DF_Equipment_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Equipment] ADD  CONSTRAINT [DF_Equipment_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Equipment] ADD  CONSTRAINT [DF_Equipment_Category]  DEFAULT ('strength') FOR [Category]
GO
ALTER TABLE [dbo].[EquipmentExercises] ADD  CONSTRAINT [DF_EquipmentExercises_IsDefault]  DEFAULT ((0)) FOR [IsDefault]
GO
ALTER TABLE [dbo].[EquipmentExercises] ADD  CONSTRAINT [DF_EquipmentExercises_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[EquipmentMuscles] ADD  CONSTRAINT [DF_EquipmentMuscles_ActivationLevel]  DEFAULT ((3)) FOR [ActivationLevel]
GO
ALTER TABLE [dbo].[EquipmentMuscles] ADD  CONSTRAINT [DF_EquipmentMuscles_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[ExerciseMuscles] ADD  CONSTRAINT [DF_ExerciseMuscles_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Exercises] ADD  CONSTRAINT [DF_Exercises_ExerciseType]  DEFAULT ('strength') FOR [ExerciseType]
GO
ALTER TABLE [dbo].[Exercises] ADD  CONSTRAINT [DF_Exercises_TimerMode]  DEFAULT ('sets_reps') FOR [TimerMode]
GO
ALTER TABLE [dbo].[Exercises] ADD  CONSTRAINT [DF_Exercises_DefaultRestSeconds]  DEFAULT ((0)) FOR [DefaultRestSeconds]
GO
ALTER TABLE [dbo].[Exercises] ADD  CONSTRAINT [DF_Exercises_DefaultSeriesDurationSeconds]  DEFAULT ((60)) FOR [DefaultSeriesDurationSeconds]
GO
ALTER TABLE [dbo].[Exercises] ADD  CONSTRAINT [DF_Exercises_DifficultyLevel]  DEFAULT ('beginner') FOR [DifficultyLevel]
GO
ALTER TABLE [dbo].[Exercises] ADD  CONSTRAINT [DF_Exercises_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Exercises] ADD  CONSTRAINT [DF_Exercises_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Muscles] ADD  CONSTRAINT [DF_Muscles_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Muscles] ADD  CONSTRAINT [DF_Muscles_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Reservations] ADD  CONSTRAINT [DF_Reservations_Status]  DEFAULT ('active') FOR [Status]
GO
ALTER TABLE [dbo].[Reservations] ADD  CONSTRAINT [DF_Reservations_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[TimeSlots] ADD  CONSTRAINT [DF_TimeSlots_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_MustChangePassword]  DEFAULT ((0)) FOR [MustChangePassword]
GO
ALTER TABLE [dbo].[Users] ADD  CONSTRAINT [DF_Users_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[WorkoutPlanItems] ADD  DEFAULT ((60)) FOR [RestSeconds]
GO
ALTER TABLE [dbo].[WorkoutPlanItems] ADD  CONSTRAINT [DF_WorkoutPlanItems_ExerciseType]  DEFAULT ('strength') FOR [ExerciseType]
GO
ALTER TABLE [dbo].[WorkoutPlanItems] ADD  CONSTRAINT [DF_WorkoutPlanItems_TimerMode]  DEFAULT ('duration') FOR [TimerMode]
GO
ALTER TABLE [dbo].[WorkoutPlanItems] ADD  CONSTRAINT [DF_WorkoutPlanItems_AutoAdvance]  DEFAULT ((1)) FOR [AutoAdvance]
GO
ALTER TABLE [dbo].[WorkoutPlanItems] ADD  CONSTRAINT [DF_WorkoutPlanItems_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[WorkoutPlanItems] ADD  CONSTRAINT [DF_WorkoutPlanItems_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[WorkoutPlanItems] ADD  CONSTRAINT [DF_WorkoutPlanItems_SeriesDurationSeconds]  DEFAULT ((60)) FOR [SeriesDurationSeconds]
GO
ALTER TABLE [dbo].[WorkoutPlans] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[WorkoutPlans] ADD  CONSTRAINT [DF_WorkoutPlans_Goal]  DEFAULT ('general') FOR [Goal]
GO
ALTER TABLE [dbo].[WorkoutPlans] ADD  CONSTRAINT [DF_WorkoutPlans_DifficultyLevel]  DEFAULT ('beginner') FOR [DifficultyLevel]
GO
ALTER TABLE [dbo].[WorkoutPlans] ADD  CONSTRAINT [DF_WorkoutPlans_IsActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[WorkoutPlans] ADD  DEFAULT ((0)) FOR [IsTemplate]
GO
ALTER TABLE [dbo].[WorkoutPlans] ADD  CONSTRAINT [DF_WorkoutPlans_IsSystemGenerated]  DEFAULT ((0)) FOR [IsSystemGenerated]
GO
ALTER TABLE [dbo].[WorkoutSessions] ADD  CONSTRAINT [DF_WorkoutSessions_Status]  DEFAULT ('scheduled') FOR [Status]
GO
ALTER TABLE [dbo].[WorkoutSessions] ADD  CONSTRAINT [DF_WorkoutSessions_CreatedAt]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[EquipmentAlternatives]  WITH CHECK ADD  CONSTRAINT [FK_EquipmentAlternatives_Alternative] FOREIGN KEY([AlternativeEquipmentId])
REFERENCES [dbo].[Equipment] ([EquipmentId])
GO
ALTER TABLE [dbo].[EquipmentAlternatives] CHECK CONSTRAINT [FK_EquipmentAlternatives_Alternative]
GO
ALTER TABLE [dbo].[EquipmentAlternatives]  WITH CHECK ADD  CONSTRAINT [FK_EquipmentAlternatives_Equipment] FOREIGN KEY([EquipmentId])
REFERENCES [dbo].[Equipment] ([EquipmentId])
GO
ALTER TABLE [dbo].[EquipmentAlternatives] CHECK CONSTRAINT [FK_EquipmentAlternatives_Equipment]
GO
ALTER TABLE [dbo].[EquipmentExercises]  WITH CHECK ADD  CONSTRAINT [FK_EquipmentExercises_Equipment] FOREIGN KEY([EquipmentId])
REFERENCES [dbo].[Equipment] ([EquipmentId])
GO
ALTER TABLE [dbo].[EquipmentExercises] CHECK CONSTRAINT [FK_EquipmentExercises_Equipment]
GO
ALTER TABLE [dbo].[EquipmentExercises]  WITH CHECK ADD  CONSTRAINT [FK_EquipmentExercises_Exercises] FOREIGN KEY([ExerciseId])
REFERENCES [dbo].[Exercises] ([ExerciseId])
GO
ALTER TABLE [dbo].[EquipmentExercises] CHECK CONSTRAINT [FK_EquipmentExercises_Exercises]
GO
ALTER TABLE [dbo].[EquipmentMuscles]  WITH CHECK ADD  CONSTRAINT [FK_EquipmentMuscles_Equipment] FOREIGN KEY([EquipmentId])
REFERENCES [dbo].[Equipment] ([EquipmentId])
GO
ALTER TABLE [dbo].[EquipmentMuscles] CHECK CONSTRAINT [FK_EquipmentMuscles_Equipment]
GO
ALTER TABLE [dbo].[EquipmentMuscles]  WITH CHECK ADD  CONSTRAINT [FK_EquipmentMuscles_Muscles] FOREIGN KEY([MuscleId])
REFERENCES [dbo].[Muscles] ([MuscleId])
GO
ALTER TABLE [dbo].[EquipmentMuscles] CHECK CONSTRAINT [FK_EquipmentMuscles_Muscles]
GO
ALTER TABLE [dbo].[ExerciseMuscles]  WITH CHECK ADD  CONSTRAINT [FK_ExerciseMuscles_Exercises] FOREIGN KEY([ExerciseId])
REFERENCES [dbo].[Exercises] ([ExerciseId])
GO
ALTER TABLE [dbo].[ExerciseMuscles] CHECK CONSTRAINT [FK_ExerciseMuscles_Exercises]
GO
ALTER TABLE [dbo].[ExerciseMuscles]  WITH CHECK ADD  CONSTRAINT [FK_ExerciseMuscles_Muscles] FOREIGN KEY([MuscleId])
REFERENCES [dbo].[Muscles] ([MuscleId])
GO
ALTER TABLE [dbo].[ExerciseMuscles] CHECK CONSTRAINT [FK_ExerciseMuscles_Muscles]
GO
ALTER TABLE [dbo].[Reservations]  WITH CHECK ADD  CONSTRAINT [FK_Reservations_Equipment] FOREIGN KEY([EquipmentId])
REFERENCES [dbo].[Equipment] ([EquipmentId])
GO
ALTER TABLE [dbo].[Reservations] CHECK CONSTRAINT [FK_Reservations_Equipment]
GO
ALTER TABLE [dbo].[Reservations]  WITH CHECK ADD  CONSTRAINT [FK_Reservations_TimeSlots] FOREIGN KEY([TimeSlotId])
REFERENCES [dbo].[TimeSlots] ([TimeSlotId])
GO
ALTER TABLE [dbo].[Reservations] CHECK CONSTRAINT [FK_Reservations_TimeSlots]
GO
ALTER TABLE [dbo].[Reservations]  WITH CHECK ADD  CONSTRAINT [FK_Reservations_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO
ALTER TABLE [dbo].[Reservations] CHECK CONSTRAINT [FK_Reservations_Users]
GO
ALTER TABLE [dbo].[Reservations]  WITH CHECK ADD  CONSTRAINT [FK_Reservations_WorkoutPlanItems] FOREIGN KEY([WorkoutPlanItemId])
REFERENCES [dbo].[WorkoutPlanItems] ([WorkoutPlanItemId])
GO
ALTER TABLE [dbo].[Reservations] CHECK CONSTRAINT [FK_Reservations_WorkoutPlanItems]
GO
ALTER TABLE [dbo].[Reservations]  WITH CHECK ADD  CONSTRAINT [FK_Reservations_WorkoutSessions] FOREIGN KEY([WorkoutSessionId])
REFERENCES [dbo].[WorkoutSessions] ([WorkoutSessionId])
GO
ALTER TABLE [dbo].[Reservations] CHECK CONSTRAINT [FK_Reservations_WorkoutSessions]
GO
ALTER TABLE [dbo].[ReservationTimeSlots]  WITH CHECK ADD  CONSTRAINT [FK_ReservationTimeSlots_Reservations] FOREIGN KEY([ReservationId])
REFERENCES [dbo].[Reservations] ([ReservationId])
GO
ALTER TABLE [dbo].[ReservationTimeSlots] CHECK CONSTRAINT [FK_ReservationTimeSlots_Reservations]
GO
ALTER TABLE [dbo].[ReservationTimeSlots]  WITH CHECK ADD  CONSTRAINT [FK_ReservationTimeSlots_TimeSlots] FOREIGN KEY([TimeSlotId])
REFERENCES [dbo].[TimeSlots] ([TimeSlotId])
GO
ALTER TABLE [dbo].[ReservationTimeSlots] CHECK CONSTRAINT [FK_ReservationTimeSlots_TimeSlots]
GO
ALTER TABLE [dbo].[Users]  WITH CHECK ADD  CONSTRAINT [FK_Users_Roles] FOREIGN KEY([RoleId])
REFERENCES [dbo].[Roles] ([RoleId])
GO
ALTER TABLE [dbo].[Users] CHECK CONSTRAINT [FK_Users_Roles]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [FK_WorkoutPlanItems_Equipment] FOREIGN KEY([EquipmentId])
REFERENCES [dbo].[Equipment] ([EquipmentId])
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [FK_WorkoutPlanItems_Equipment]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [FK_WorkoutPlanItems_Exercises] FOREIGN KEY([ExerciseId])
REFERENCES [dbo].[Exercises] ([ExerciseId])
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [FK_WorkoutPlanItems_Exercises]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [FK_WorkoutPlanItems_WorkoutPlans] FOREIGN KEY([WorkoutPlanId])
REFERENCES [dbo].[WorkoutPlans] ([WorkoutPlanId])
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [FK_WorkoutPlanItems_WorkoutPlans]
GO
ALTER TABLE [dbo].[WorkoutPlans]  WITH CHECK ADD  CONSTRAINT [FK_WorkoutPlans_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO
ALTER TABLE [dbo].[WorkoutPlans] CHECK CONSTRAINT [FK_WorkoutPlans_Users]
GO
ALTER TABLE [dbo].[WorkoutSessions]  WITH CHECK ADD  CONSTRAINT [FK_WorkoutSessions_Users] FOREIGN KEY([UserId])
REFERENCES [dbo].[Users] ([UserId])
GO
ALTER TABLE [dbo].[WorkoutSessions] CHECK CONSTRAINT [FK_WorkoutSessions_Users]
GO
ALTER TABLE [dbo].[WorkoutSessions]  WITH CHECK ADD  CONSTRAINT [FK_WorkoutSessions_WorkoutPlans] FOREIGN KEY([WorkoutPlanId])
REFERENCES [dbo].[WorkoutPlans] ([WorkoutPlanId])
GO
ALTER TABLE [dbo].[WorkoutSessions] CHECK CONSTRAINT [FK_WorkoutSessions_WorkoutPlans]
GO
ALTER TABLE [dbo].[Equipment]  WITH CHECK ADD  CONSTRAINT [CK_Equipment_Quantity] CHECK  (([Quantity]>(0)))
GO
ALTER TABLE [dbo].[Equipment] CHECK CONSTRAINT [CK_Equipment_Quantity]
GO
ALTER TABLE [dbo].[EquipmentAlternatives]  WITH CHECK ADD  CONSTRAINT [CK_EquipmentAlternatives_NotSelf] CHECK  (([EquipmentId]<>[AlternativeEquipmentId]))
GO
ALTER TABLE [dbo].[EquipmentAlternatives] CHECK CONSTRAINT [CK_EquipmentAlternatives_NotSelf]
GO
ALTER TABLE [dbo].[EquipmentMuscles]  WITH CHECK ADD  CONSTRAINT [CK_EquipmentMuscles_ActivationLevel] CHECK  (([ActivationLevel]>=(1) AND [ActivationLevel]<=(5)))
GO
ALTER TABLE [dbo].[EquipmentMuscles] CHECK CONSTRAINT [CK_EquipmentMuscles_ActivationLevel]
GO
ALTER TABLE [dbo].[EquipmentMuscles]  WITH CHECK ADD  CONSTRAINT [CK_EquipmentMuscles_Role] CHECK  (([Role]='stabilizer' OR [Role]='secondary' OR [Role]='primary'))
GO
ALTER TABLE [dbo].[EquipmentMuscles] CHECK CONSTRAINT [CK_EquipmentMuscles_Role]
GO
ALTER TABLE [dbo].[ExerciseMuscles]  WITH CHECK ADD  CONSTRAINT [CK_ExerciseMuscles_ActivationLevel] CHECK  (([ActivationLevel]>=(1) AND [ActivationLevel]<=(5)))
GO
ALTER TABLE [dbo].[ExerciseMuscles] CHECK CONSTRAINT [CK_ExerciseMuscles_ActivationLevel]
GO
ALTER TABLE [dbo].[Reservations]  WITH CHECK ADD  CONSTRAINT [CK_Reservations_Status] CHECK  (([Status]='cancelled' OR [Status]='active'))
GO
ALTER TABLE [dbo].[Reservations] CHECK CONSTRAINT [CK_Reservations_Status]
GO
ALTER TABLE [dbo].[TimeSlots]  WITH CHECK ADD  CONSTRAINT [CK_TimeSlots_TimeRange] CHECK  (([StartTime]<[EndTime]))
GO
ALTER TABLE [dbo].[TimeSlots] CHECK CONSTRAINT [CK_TimeSlots_TimeRange]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlanItems_DistanceMeters] CHECK  (([DistanceMeters] IS NULL OR [DistanceMeters]>(0)))
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [CK_WorkoutPlanItems_DistanceMeters]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlanItems_DurationSeconds] CHECK  (([DurationSeconds]>(0)))
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [CK_WorkoutPlanItems_DurationSeconds]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlanItems_ExerciseType] CHECK  (([ExerciseType]='cooldown' OR [ExerciseType]='warmup' OR [ExerciseType]='stretching' OR [ExerciseType]='mobility' OR [ExerciseType]='cardio' OR [ExerciseType]='strength'))
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [CK_WorkoutPlanItems_ExerciseType]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlanItems_OrderNumber] CHECK  (([OrderNumber]>(0)))
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [CK_WorkoutPlanItems_OrderNumber]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlanItems_Repetitions] CHECK  (([Repetitions] IS NULL OR [Repetitions]>(0)))
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [CK_WorkoutPlanItems_Repetitions]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlanItems_RestSeconds] CHECK  (([RestSeconds]>=(0)))
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [CK_WorkoutPlanItems_RestSeconds]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlanItems_Rpe] CHECK  (([Rpe] IS NULL OR [Rpe]>=(1) AND [Rpe]<=(10)))
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [CK_WorkoutPlanItems_Rpe]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlanItems_SeriesDurationSeconds] CHECK  (([SeriesDurationSeconds]>(0)))
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [CK_WorkoutPlanItems_SeriesDurationSeconds]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlanItems_Sets] CHECK  (([Sets] IS NULL OR [Sets]>(0)))
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [CK_WorkoutPlanItems_Sets]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlanItems_TimerMode] CHECK  (([TimerMode]='manual' OR [TimerMode]='sets_reps' OR [TimerMode]='duration'))
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [CK_WorkoutPlanItems_TimerMode]
GO
ALTER TABLE [dbo].[WorkoutPlanItems]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlanItems_WeightKg] CHECK  (([WeightKg] IS NULL OR [WeightKg]>=(0)))
GO
ALTER TABLE [dbo].[WorkoutPlanItems] CHECK CONSTRAINT [CK_WorkoutPlanItems_WeightKg]
GO
ALTER TABLE [dbo].[WorkoutPlans]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlans_DifficultyLevel] CHECK  (([DifficultyLevel]='advanced' OR [DifficultyLevel]='intermediate' OR [DifficultyLevel]='beginner'))
GO
ALTER TABLE [dbo].[WorkoutPlans] CHECK CONSTRAINT [CK_WorkoutPlans_DifficultyLevel]
GO
ALTER TABLE [dbo].[WorkoutPlans]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlans_EstimatedDurationSeconds] CHECK  (([EstimatedDurationSeconds] IS NULL OR [EstimatedDurationSeconds]>(0)))
GO
ALTER TABLE [dbo].[WorkoutPlans] CHECK CONSTRAINT [CK_WorkoutPlans_EstimatedDurationSeconds]
GO
ALTER TABLE [dbo].[WorkoutPlans]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutPlans_Goal] CHECK  (([Goal]='rehabilitation' OR [Goal]='mobility' OR [Goal]='fat_loss' OR [Goal]='endurance' OR [Goal]='hypertrophy' OR [Goal]='strength' OR [Goal]='general'))
GO
ALTER TABLE [dbo].[WorkoutPlans] CHECK CONSTRAINT [CK_WorkoutPlans_Goal]
GO
ALTER TABLE [dbo].[WorkoutSessions]  WITH CHECK ADD  CONSTRAINT [CK_WorkoutSessions_Status] CHECK  (([Status]='cancelled' OR [Status]='completed' OR [Status]='active' OR [Status]='scheduled'))
GO
ALTER TABLE [dbo].[WorkoutSessions] CHECK CONSTRAINT [CK_WorkoutSessions_Status]
GO
