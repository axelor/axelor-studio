export const getMenuBuilderTitle = (option, data) => {
	let text = option.title || "";
	if (option.parent) {
		const parent = data.find((item) => item.id === option.parent.id);
		if (parent) {
			const parentText = getMenuBuilderTitle(
				parent,
				(data && data.filter((f) => f.id !== parent.id)) || []
			);
			if (parentText) {
				text = `${parentText} > ${text}`;
			}
		}
	}
	return text;
};
