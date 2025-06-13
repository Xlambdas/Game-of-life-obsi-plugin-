export const QuestForm = () => {
	return (
		<form>
			<label>
				Quest Name:
				<input type="text" name="questName" />
			</label>
			<button type="submit">Create Quest</button>
		</form>
	);
};
