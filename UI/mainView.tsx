import React, { useEffect, useState } from "react";
import {
	RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend,
	LineChart, Line, XAxis, YAxis, CartesianGrid,
	PieChart, Pie, Cell
} from "recharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
// from files (services, Default):
import { useAppContext } from "context/appContext";
import { UserSettings, Quest, Habit } from "../data/DEFAULT";
// from files (UI, components):
import { UserCard } from "../components/forms/UI/userCard";


export const MainView: React.FC = () => {
	const appService = useAppContext();
	const [quests, setQuests] = useState<Quest[]>([]);
	const [habits, setHabits] = useState<Habit[]>([]);
	const [user, setUser] = useState<UserSettings | null>(null);

	const loadData = async () => {
		const [loadedUser, loadedQuests, loadedHabits] = await Promise.all([
		appService.dataService.get("user"),
		appService.dataService.get("quests"),
		appService.dataService.get("habits"),
		]);

		setUser(
		loadedUser && typeof loadedUser === "object" && "settings" in loadedUser
			? (loadedUser as UserSettings)
			: null
		);
		setQuests(Object.values(loadedQuests));
		setHabits(Object.values(loadedHabits));
	};

	useEffect(() => {
		if (!appService) return;
		loadData();
	}, [appService]);

	useEffect(() => {
		const handleReload = () => loadData();
		document.addEventListener("dbUpdated", handleReload);
		return () => document.removeEventListener("dbUpdated", handleReload);
	}, []);

	if (!user) return <p>Loading...</p>;

	const data = Object.entries(user.attribute).map(([attr, value]) => ({
		attribute: attr.charAt(0).toUpperCase() + attr.slice(1),
		value,
	}));

	const xpData = [
		{ day: 'Mon', xp: 20 }, { day: 'Tue', xp: 35 }, { day: 'Wed', xp: 40 },
		{ day: 'Thu', xp: 30 }, { day: 'Fri', xp: 50 }, { day: 'Sat', xp: 25 },
		{ day: 'Sun', xp: 60 }
	];

	const totalHabits = habits.length;
	const completedHabits = habits.filter(h => h.streak.isCompletedToday).length;
	const completionPercent = totalHabits ? Math.round((completedHabits / totalHabits) * 100) : 0;


	return (
		<div className="main-view">
		<div className="dashboard-container">
			{/* Left Column */}
			<div className="dashboard-left column">
				<UserCard user={user} />

				{/* Attributes Panel */}
				<div className="card">
					<h2>Attributes</h2>
					<div className="attributes">
					{Object.entries(user.attribute).map(([attr, xp]) => (
						<div key={attr} className="attribute">
						<span className="attr-name">{attr.charAt(0).toUpperCase() + attr.slice(1)}</span>
						<span className="attr-value">{xp} XP</span>
						</div>
					))}
					</div>
				</div>

				<div className="card">
					<h2>Habits</h2>
					{habits.length === 0 ? (
					<p className="empty">No habits yet. Add one!</p>
					) : (
					<ul className="list">
						{habits.map((habit) => (
						<li key={habit.title} className="list-item">
							<span>{habit.title}</span>
							<span className="meta">Streak: {habit.streak.current || 0}</span>
						</li>
						))}
					</ul>
					)}
				</div>
				<div className="calendar-card card">
					<h2>Activity Calendar</h2>
					<Calendar
						onClickDay={(value) => console.log("Selected:", value)}
						tileClassName={({ date, view }) => {
						// Exemple : colorer les jours avec des quêtes ou habitudes complétées
						if (habits.some(h => new Date(h.streak.lastCompletedDate).toDateString() === date.toDateString())) {
							return "calendar-habit-done";
						}
						if (quests.some(q => new Date(q.progression.dueDate as Date).toDateString() === date.toDateString())) {
							return "calendar-quest";
						}
						return null;
						}}
					/>
					<div className="calendar-legend">
						<span className="legend-item"><span className="color-box green"></span> Habit done</span>
						<span className="legend-item"><span className="color-box yellow"></span> Quest day</span>
					</div>
				</div>
			</div>

			{/* Right Column */}
			<div className="dashboard-right column">{/* Radar Chart */}
			<div className="card">
				<h2>Attribute Overview</h2>
				<div className="radar-wrapper">
						<ResponsiveContainer width="100%" height={400}>
							<RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
								<PolarGrid stroke="rgba(255,255,255,0.1)" />
								<PolarAngleAxis dataKey="attribute" stroke="#ccc" />
								<PolarRadiusAxis stroke="rgba(255,255,255,0.2)" />
								<Radar
								name="Attributes"
								dataKey="value"
								stroke="#00bcd4"
								fill="url(#grad)"
								fillOpacity={0.6}
								isAnimationActive={true}
								/>
								<defs>
								<radialGradient id="grad" cx="50%" cy="50%" r="50%">
									<stop offset="0%" stopColor="#00bcd4" stopOpacity={0.7} />
									<stop offset="100%" stopColor="#00796b" stopOpacity={0.1} />
								</radialGradient>
								</defs>
								<Tooltip
								contentStyle={{ backgroundColor: "#1a1a1a", border: "none" }}
								/>
								<Legend />
							</RadarChart>
						</ResponsiveContainer>
					</div>
			</div>

			{/* Quests Panel */}
			<div className="card">
				<h2>Quests</h2>
				{quests.length === 0 ? (
				<p className="empty">No quests yet. Create one!</p>
				) : (
				<ul className="list">
					{quests.map((quest) => (
					<li key={quest.title} className="list-item">
						<span>{quest.title}</span>
						<span className="meta">{quest.settings.priority} / {quest.settings.difficulty}</span>
					</li>
					))}
				</ul>
				)}
			</div>

			{/* XP Over Time */}
			<div className="card">
				<h2>XP Over Time</h2>
				<ResponsiveContainer width="100%" height={200}>
				<LineChart data={xpData}>
					<CartesianGrid stroke="rgba(255,255,255,0.1)" />
					<XAxis dataKey="day" stroke="#ccc" />
					<YAxis stroke="#ccc" />
					<Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "none" }} />
					<Line type="monotone" dataKey="xp" stroke="#00bcd4" strokeWidth={2} />
				</LineChart>
				</ResponsiveContainer>
			</div>

			{/* Habits Completion Pie */}
			<div className="card">
				<h2>Habits Completion</h2>
				<ResponsiveContainer width="100%" height={200}>
				<PieChart>
					<Pie
					data={[
						{ name: 'Completed', value: completedHabits },
						{ name: 'Pending', value: totalHabits - completedHabits }
					]}
					dataKey="value"
					nameKey="name"
					innerRadius={40}
					outerRadius={60}
					fill="#00bcd4"
					>
					<Cell fill="#00bcd4" />
					<Cell fill="#00796b" />
					</Pie>
					<Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "none" }} />
				</PieChart>
				</ResponsiveContainer>
			</div>
			</div>
			<div className="full-width column">
				<h2>Skills Map</h2>
				<SkillsView />
			</div>
		</div>
		</div>
	);
};




import { useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

// === Custom node for RPG-like skill display ===
const SkillNode = ({ data }: any) => {
  return (
    <div className="skill-node">
      <div className="skill-title">{data.label}</div>
      <div className="skill-xp-bar">
        <div
          className="skill-xp-fill"
          style={{ width: `${Math.min((data.xp / data.maxXp) * 100, 100)}%` }}
        />
      </div>
      <span className="skill-xp-text">{data.xp} / {data.maxXp} XP</span>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = { skill: SkillNode };

const nodes = [
  {
    id: "1",
    type: "skill",
    position: { x: 300, y: 0 },
    data: { label: "Discipline", xp: 450, maxXp: 1000 },
  },
  {
    id: "2",
    type: "skill",
    position: { x: 150, y: 150 },
    data: { label: "Focus", xp: 200, maxXp: 500 },
  },
  {
    id: "3",
    type: "skill",
    position: { x: 450, y: 150 },
    data: { label: "Routine", xp: 320, maxXp: 500 },
  },
  {
    id: "4",
    type: "skill",
    position: { x: 150, y: 300 },
    data: { label: "Deep Work", xp: 120, maxXp: 400 },
  },
  {
    id: "5",
    type: "skill",
    position: { x: 450, y: 300 },
    data: { label: "Habit Mastery", xp: 280, maxXp: 400 },
  },
];

const edges = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e1-3", source: "1", target: "3", animated: true },
  { id: "e2-4", source: "2", target: "4", animated: true },
  { id: "e3-5", source: "3", target: "5", animated: true },
];

export const SkillsView = () => {
  const onNodeClick = useCallback((_: any, node: any) => {
    console.log("Clicked:", node.data.label);
  }, []);

  return (
    <div className="skills-view">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        onNodeClick={onNodeClick}
        defaultEdgeOptions={{
          style: { stroke: "#8884d8", strokeWidth: 2 },
          type: "smoothstep",
        }}
      >
        <MiniMap nodeColor={() => "#444"} />
        <Controls />
        <Background gap={20} color="#222" />
      </ReactFlow>
    </div>
  );
};









