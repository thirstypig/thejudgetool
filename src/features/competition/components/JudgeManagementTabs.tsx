"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/ui/tabs";
import { RosterTab } from "./RosterTab";
import { CheckInTab } from "./CheckInTab";
import type { CompetitionJudgeWithUser } from "../types";

interface JudgeManagementTabsProps {
  competitionId: string;
  judgePin: string | null;
  roster: CompetitionJudgeWithUser[];
}

export function JudgeManagementTabs({
  competitionId,
  judgePin,
  roster,
}: JudgeManagementTabsProps) {
  return (
    <Tabs defaultValue="roster">
      <TabsList>
        <TabsTrigger value="roster">Roster</TabsTrigger>
        <TabsTrigger value="checkin">Check-In &amp; Tables</TabsTrigger>
      </TabsList>

      <TabsContent value="roster">
        <RosterTab competitionId={competitionId} roster={roster} />
      </TabsContent>

      <TabsContent value="checkin">
        <CheckInTab
          competitionId={competitionId}
          judgePin={judgePin}
          roster={roster}
        />
      </TabsContent>
    </Tabs>
  );
}
