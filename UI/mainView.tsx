import React, { useEffect, useState } from "react";
import {
	RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend,
	LineChart, Line, XAxis, YAxis, CartesianGrid,
	PieChart, Pie, Cell
} from "recharts";
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
		appService.get("user"),
		appService.get("quests"),
		appService.get("habits"),
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
		</div>
		</div>
	);
};







