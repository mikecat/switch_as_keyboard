"use strict";

window.addEventListener("DOMContentLoaded", () => {
	const theTableBody = document.getElementById("theTableBody");
	const logResetButton = document.getElementById("logResetButton");

	let receivePhase = 0;
	let receivedPart = 0;
	const receivedData = [];

	const base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,.";

	document.addEventListener("keydown", (event) => {
		const k = event.key;
		if (k === " ") {
			// 空白 = 状態リセット
			receivePhase = 0;
			receivedData.splice(0);
		} else if (receivePhase >= 0) {
			const idx = base64chars.indexOf(k);
			if (k.length === 1 && idx >= 0) {
				if (receivePhase === 0) {
					receivedPart = idx << 2;
					receivePhase = 1;
				} else if (receivePhase === 1) {
					receivedData.push(receivedPart | (idx >> 4));
					receivedPart = (idx << 4) & 0xf0;
					receivePhase = 2;
				} else if (receivePhase === 2) {
					receivedData.push(receivedPart | (idx >> 2));
					receivedPart = (idx << 6) & 0xc0;
					receivePhase = 3;
				} else if (receivePhase === 3) {
					receivedData.push(receivedPart | idx);
					receivePhase = 0;
				}
				if (receivedData.length > 0 && (receivedData[0] >> 3) + 3 === receivedData.length) {
					// 規定の長さになったので、チェックサムをチェック
					let sum = 0;
					for (let i = 0; i < receivedData.length; i++) {
						sum += receivedData[i];
					}
					if ((sum & 0xff) === 0) {
						// チェックサムOK：ログを記録して状態をリセット
						const time = new Date();
						let status = "";
						for (let i = 0; i <= receivedData[0]; i++) {
							status += (receivedData[(i >> 3) + 1] >> (i & 7)) & 1 ? "●" : "○";
						}
						receivePhase = 0;
						receivedData.splice(0);

						const tr = document.createElement("tr");
						const td1 = document.createElement("td");
						td1.appendChild(document.createTextNode(time.toLocaleString()));
						tr.appendChild(td1);
						const td2 = document.createElement("td");
						td2.appendChild(document.createTextNode(status));
						tr.appendChild(td2);
						theTableBody.appendChild(tr);
						logResetButton.scrollIntoView(false);
					} else {
						// チェックサムNG：エラー状態に遷移
						receivePhase = -1;
					}
				}
			}
		}
	});

	logResetButton.addEventListener("click", () => {
		while (theTableBody.firstChild) {
			theTableBody.removeChild(theTableBody.firstChild);
		}
		logResetButton.blur();
	});
});
