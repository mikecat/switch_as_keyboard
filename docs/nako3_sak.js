"use strict";

const STATUS_KEY = "__320edbf2-7a02-488f-9f98-ff740b4cb87d";
const CHARS_TO_ACCEPT = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.";

const sakPlugin = {
	meta: {
		type: "const",
		value: {
			pluginName: "switch_as_keyboard-for-nako3",
			description: "「スイッチの情報をキーボード入力として伝えるやつ」の情報を受け取ります。",
			pluginVersion: "1.0.0",
			nakoRuntime: ["wnako"],
			nakoVersion: "3.6.0",
		},
	},
	"初期化": {
		type: "func",
		josi: [],
		fn: function(sys) {
			const status = sys[STATUS_KEY] ?? (sys[STATUS_KEY] = {});
			if (typeof document !== "object") return;
			status.callbacks = [];
			status.switchStatus = [];
			status.inputs = "";
			status.wantedInputLength = -1;
			const eventHandler = (event) => {
				if (event.key === "-" || event.key === " ") {
					// 入力状態リセット
					status.inputs = "";
					status.wantedInputLength = 0;
				} else if (event.key.length === 1 && CHARS_TO_ACCEPT.indexOf(event.key) >= 0) {
					// 入力データ受信
					status.inputs += event.key.replace(",", "+").replace(".", "/");
					if (status.inputs.length === 2) {
						// 最初のバイトから、入力の長さを求める
						const numSwitches = atob(status.inputs).charCodeAt(0) + 1;
						const numBytes = ((numSwitches + 7) >> 3) + 2;
						status.wantedInputLength = ((numBytes * 4 + 2) / 3) >> 0;
					} else if (status.inputs.length === status.wantedInputLength) {
						// 必要十分な文字数を受信した
						const decoded = Array.from(atob(status.inputs), (c) => c.charCodeAt(0));
						const sum = decoded.reduce((x, y) => x + y);
						if (sum % 0x100 === 0) {
							const switchStatus = [];
							for (let i = 0; i < decoded[0] + 1; i++) {
								switchStatus.push(((decoded[(i >> 3) + 1] >> (i % 8)) & 1) !== 0);
							}
							status.switchStatus = switchStatus;
							status.callbacks.forEach((func) => func(switchStatus));
						}
						status.inputs = "";
						status.wantedInputLength = -1;
					}
				}
			};
			if (status.eventHandler) document.removeEventListener("keydown", status.eventHandler);
			document.addEventListener("keydown", eventHandler);
			status.eventHandler = eventHandler;
			status.initialized = true;
		},
		return_none: true,
	},
	"!クリア": {
		type: "func",
		josi: [],
		fn: function(sys) {
			const status = sys[STATUS_KEY] ?? (sys[STATUS_KEY] = {});
			if (!status.initialized) return;
			document.removeEventListener("keydown", status.eventHandler);
			status.callbacks = [];
			status.switchStatus = [];
			status.inputs = "";
			status.wantedInputLength = -1;
			status.initialized = false;
		},
		return_none: true,
	},
	"スイッチ受信時": { // @スイッチの状態を受信した際に実行する処理を登録する。 // @すいっちじゅしんしたとき
		type: "func",
		josi: [["で"]],
		fn: function(func, sys) {
			const status = sys[STATUS_KEY] ?? (sys[STATUS_KEY] = {});
			if (!status.initialized) return;
			status.callbacks.push(func);
		},
		return_none: true,
	},
	"スイッチ状態": { // @前回受信したスイッチの状態を返す。 // @すいっちじょうたい
		type: "func",
		josi: [],
		fn: function(sys) {
			const status = sys[STATUS_KEY] ?? (sys[STATUS_KEY] = {});
			if (!status.initialized) return [];
			return status.switchStatus;
		},
	},
};

if (typeof navigator === "object" && navigator !== null) {
	if (navigator.nako3) navigator.nako3.addPluginObject("sakPlugin", sakPlugin);
} else if (typeof module !== "undefined" && module !== null) {
	module.exports = sakPlugin;
}
