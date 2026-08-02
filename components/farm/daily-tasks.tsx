"use client"

import { useFarm } from "@/contexts/farm-context"
import { DAILY_TASKS } from "@/lib/farm-types"
import { useTranslation } from "@/hooks/use-translation"

export function DailyTasks() {
  const { state, completeTask } = useFarm()
  const { t } = useTranslation()
  const now = new Date()
  const today = now.toISOString().split("T")[0]

  // Check if tasks have been reset today (comparing with last reset date)
  const tasksResetToday = state.lastTaskResetDate === today

  const getTaskStatus = (taskId: string) => {
    return state.completedTasks.includes(taskId)
  }

  const level = Math.floor(state.xp / 100) + 1
  const xpProgress = state.xp % 100

  return (
    <div className="space-y-4">
      <div className="bg-card border-2 border-primary rounded-xl p-4">
        <div className="grid grid-cols-3 gap-4 text-center sm:gap-3 w-full">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground uppercase text-nowrap">{t("level")}</span>
            <span className="text-lg font-bold text-primary">{level}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground uppercase text-nowrap">{t("tasks_xp")}</span>
            <span className="text-sm font-bold text-secondary">{state.xp}</span>
            <div className="w-24 h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-secondary to-primary transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground uppercase text-nowrap">{t("balance")}</span>
            <span className="text-sm font-bold text-accent">
              {state.completedTasks.length}/{DAILY_TASKS.length}
            </span>
          </div>
        </div>
      </div>

      <header className="text-center">
        <h2 className="text-xl font-bold text-primary text-glow-gold">{t("tasks_title")}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {now.toLocaleDateString()} 
          {tasksResetToday && <span className="ml-2 text-secondary">✓ Fresh tasks today</span>}
        </p>
      </header>

      <div className="space-y-3">
        {DAILY_TASKS.map((task) => {
          const isCompleted = getTaskStatus(task.id)
          return (
            <button
              key={task.id}
              onClick={() => {
                if (!isCompleted) {
                  completeTask(task.id)
                }
              }}
              disabled={isCompleted}
              className={`w-full rounded-xl border-2 p-4 transition-all text-left disabled:cursor-default flex flex-wrap ${
                isCompleted
                  ? "bg-secondary/20 border-secondary/60"
                  : "bg-card border-primary/30 hover:border-primary/60 active:scale-95 cursor-pointer"
              }`}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="text-3xl flex-shrink-0 min-w-fit">
                  {isCompleted ? "✓" : task.id === "feed_chickens" ? "🐔" : task.id === "harvest_crops" ? "🌾" : "👨‍🍳"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {t(task.titleKey)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(task.descKey)}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-1 rounded whitespace-nowrap">
                      +{task.xpReward} XP
                    </span>
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded whitespace-nowrap">
                      +{task.coinReward} 🪙
                    </span>
                  </div>
                </div>
                {isCompleted && (
                  <div className="flex-shrink-0 text-secondary font-bold text-xs bg-secondary/20 px-2 py-1 rounded whitespace-nowrap">
                    {t("task_completed")}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="bg-background/50 border border-primary/30 rounded-lg p-3">
        <p className="text-[10px] text-muted-foreground text-center">
          {t("drag_drop_hint")}
        </p>
      </div>
    </div>
  )
}
