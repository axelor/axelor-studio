import React, { useState, useEffect } from "react";
import moment from "moment";
import { nanoid } from "nanoid";
import { IconButton, TextField, Avatar, Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import {
  ArrowForward,
  QuestionAnswerOutlined,
  Edit,
  Clear,
} from "@material-ui/icons";

import { getInfo } from "../../../../../services/api";
import { COLORS } from "../../../constants";
import {
  getComments,
  addComment,
  removeComment,
  updateComment,
} from "../../../extra";
import { translate } from "../../../../../utils";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: 14,
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  divider: {
    marginTop: 15,
    borderTop: "1px dotted #ccc",
  },
  comments: {
    overflowY: "auto",
    overflowX: "hidden",
  },
  textField: {
    marginTop: 10,
    width: "100%",
  },
  reply: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  button: {
    border: "1px solid #58B423",
    borderRadius: 4,
    marginLeft: 10,
  },
  small: {
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
  sublabel: {
    fontSize: 14,
    margin: "10px 0px",
    fontStyle: "italic",
  },
  buttons: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    color: "white",
    textTransform: "none",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
}));

const avatarColor = {};

const getColor = () => {
  let no = Math.round(Math.random() * 10) % COLORS.length;
  let values = Object.values(avatarColor) || [];
  if (values.includes(COLORS[no])) {
    if (values.length === COLORS.length || values.includes("gray")) {
      return "gray";
    }
    getColor();
  } else {
    return COLORS[no];
  }
};

const getAvatarColor = (id) => {
  if (avatarColor[id]) return avatarColor[id];
  let color = getColor();
  if (color) {
    return (avatarColor[id] = color);
  }
};

export default function Comments({ element, updateCommentsCount }) {
  const [comment, setComment] = useState("");
  const [editComment, setEditComment] = useState(null);
  const [comments, setComments] = useState(null);
  const [user, setUser] = useState(null);
  const classes = useStyles();

  const getCommentGroups = (comments) => {
    const groups = comments.reduce((groups, game) => {
      const date = game[1];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push([...game, false]);
      return groups;
    }, {});
    return groups;
  };

  const addNewComment = () => {
    addComment(
      element,
      user,
      moment().format("DD/MM/YYYY"),
      moment().format("HH.mm"),
      comment,
      nanoid()
    );
    let comments = getComments(element);
    setComments(getCommentGroups(comments));
    setComment("");
    updateCommentsCount(true);
  };

  const updateEdit = (key, id, value, valueIndex) => {
    const cloneElements = { ...comments };
    let index = cloneElements[key].findIndex((f) => f.includes(id));
    if (index > -1) {
      cloneElements[key][index][valueIndex] = value;
      setComments(cloneElements);
    }
  };

  const removeNewComment = (key, id) => {
    const cloneElements = { ...comments };
    let index = cloneElements[key].findIndex((f) => f.includes(id));
    if (index > -1) {
      cloneElements[key].splice(index, 1);
      setComments(cloneElements);
    }
  };

  const renderKey = (key) => {
    if (key === moment().format("DD/MM/YYYY")) {
      return "Today";
    } else if (key === moment().subtract(1, "days").format("DD/MM/YYYY")) {
      return "Yesterday";
    } else {
      return key;
    }
  };

  useEffect(() => {
    async function getUser() {
      const info = await getInfo();
      setUser((info && info["user.name"]) || "");
    }
    getUser();
  }, []);

  useEffect(() => {
    let comments = getComments(element);
    setComments(getCommentGroups(comments));
  }, [element]);

  return (
    <div className={classes.root}>
      {comments && Object.keys(comments).length === 0 && (
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ marginRight: 20 }}>
            <QuestionAnswerOutlined style={{ fontSize: 25, color: "#666" }} />
          </div>
          <div>
            <div className={classes.groupLabel}>
              {translate("Add comments")}
            </div>
            <div className={classes.sublabel}>
              {translate(
                "You can add comments about diagrams or specific BPMN elements."
              )}
            </div>
          </div>
        </div>
      )}
      <div className={classes.root}>
        <div className={classes.comments}>
          {comments &&
            Object.entries(comments).map(([key, value]) => (
              <div key={key}>
                <div className={classes.label}>{renderKey(key)}</div>
                <div>
                  {value &&
                    value.length > 0 &&
                    value.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          margin: "10px 0px",
                        }}
                      >
                        <div style={{ marginRight: 10 }}>
                          <Avatar
                            className={classes.small}
                            style={{
                              background: getAvatarColor(
                                c && c[0] && c[0].charAt(0)
                              ),
                            }}
                          >
                            {c && c[0] && c[0].charAt(0)}
                          </Avatar>
                        </div>
                        <div style={{ width: "calc(100% - 85px)" }}>
                          <div>
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <div
                                style={{
                                  fontWeight: "bold",
                                  fontSize: 14,
                                  marginRight: 20,
                                }}
                              >
                                {c && c[0]}
                              </div>
                              <div style={{ color: "#999" }}>
                                {c && c[2] && c[2].replace(".", ":")}
                              </div>
                            </div>
                            {c && c[5] ? (
                              <React.Fragment>
                                <TextField
                                  variant="outlined"
                                  className={classes.textField}
                                  onChange={(e) =>
                                    setEditComment(e.target.value)
                                  }
                                  defaultValue={c && c[3]}
                                  size="small"
                                  placeholder={translate("Comment")}
                                  multiline
                                  minRows={1}
                                />
                                <Button
                                  className={classes.buttons}
                                  onClick={() => {
                                    updateEdit(key, c && c[4], false, 5);
                                    updateEdit(key, c && c[4], editComment, 3);
                                    updateComment(element, c, editComment);
                                  }}
                                >
                                  {translate("Update comment")}
                                </Button>
                                <Button
                                  className={classes.buttons}
                                  onClick={() => {
                                    updateEdit(key, c && c[4], false, 5);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </React.Fragment>
                            ) : (
                              <div
                                style={{
                                  whiteSpace: "pre-wrap",
                                  overflowWrap: "break-word",
                                }}
                              >
                                {c && c[3]}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <IconButton
                            size="small"
                            onClick={() => updateEdit(key, c && c[4], true, 5)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              removeNewComment(key, c && c[4]);
                              removeComment(element, c);
                              updateCommentsCount(false);
                            }}
                          >
                            <Clear fontSize="small" />
                          </IconButton>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
        <div className={classes.reply}>
          <TextField
            label={`${translate("Reply")}...`}
            variant="outlined"
            className={classes.textField}
            onChange={(e) => setComment(e.target.value)}
            value={comment}
            size="small"
            multiline
            minRows={4}
          />
          <IconButton
            size="small"
            className={classes.button}
            onClick={addNewComment}
          >
            <ArrowForward fontSize="large" style={{ color: "#58B423" }} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
