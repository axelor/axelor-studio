import React from "react";
import { TextField, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useStore } from "../store/context";
const useStyles = makeStyles({
	container: {
		marginBottom: 15,
	},
	row: {
		display: "flex",
	},
	languageText: {
		width: "15%",
		marginTop: 8,
		textTransform: "capitalize",
		textAlign: "center",
	},
});

function TranslationGrid(props) {
	const classes = useStyles();
	const { state, update } = useStore();
	const { keyValue, ...rest } = props;
	const { translationList } = state;
	const [translations, setTranslations] = React.useState([]);

	const handleTranslationChange = React.useCallback(
		({ key, message, language }) => {
			setTranslations((_translations) => {
				let newList = [..._translations];
				const translationIndex = newList.findIndex(
					(e) => e.key === key && e.language === language
				);

				if (translationIndex !== -1) {
					newList[translationIndex] = { ...newList[translationIndex], message };
				} else {
					newList.push({ key, message, language });
				}
				return [...newList];
			});
		},
		[]
	);

	const handleTranslationUpdate = React.useCallback(
		({ key, message, language }) => {
			update((draft) => {
				const translationIndex = draft.translationList.findIndex(
					(e) => e.key === key && e.language === language
				);

				if (translationIndex !== -1) {
					draft.translationList[translationIndex].message = message;
				} else {
					draft.translationList.push({ key, message, language });
				}
			});
		},
		[update]
	);

	React.useEffect(() => {
		setTranslations([...translationList]);
	}, [translationList]);

	return (
		<div className={classes.container}>
			{state.languageList.map((lang, i) => (
				<div key={i} className={classes.row}>
					<Typography classes={{ root: classes.languageText }}>
						{lang.value}
					</Typography>
					<TextField
						variant="outlined"
						{...rest}
						value={
							translations.find(
								(e) => e.key === keyValue && e.language === lang.value
							)?.message || ""
						}
						onChange={(e) =>
							handleTranslationChange({
								key: keyValue,
								message: e.target.value,
								language: lang.value,
							})
						}
						onBlur={(e) =>
							e.target.value &&
							handleTranslationUpdate({
								key: keyValue,
								message: e.target.value,
								language: lang.value,
							})
						}
					/>
				</div>
			))}
		</div>
	);
}

export default TranslationGrid;
