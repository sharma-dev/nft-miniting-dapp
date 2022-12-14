import Web3EthContract from "web3-eth-contract";
import Web3 from "web3";
import { fetchData } from "../data/data.actions";
import abi from "../../abis/abi.json";
import * as CONFIG from "../../config/config";

const connectRequest = () => {
	return {
		type: "CONNECTION_REQUEST",
	};
};

const connectSuccess = (payload) => {
	window.localStorage.setItem("cachedProvider", JSON.stringify(payload.accounts))
	return {
		type: "CONNECTION_SUCCESS",
		payload: payload,
	};
};

const connectFailed = (payload) => {
	return {
		type: "CONNECTION_FAILED",
		payload: payload,
	};
};

const updateAccountRequest = (payload) => {
	return {
		type: "UPDATE_ACCOUNT",
		payload: payload,
	};
};

export const connect = () => {
	return async (dispatch) => {
		dispatch(connectRequest());
		const { ethereum } = window;
		const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
		if (metamaskIsInstalled) {
			Web3EthContract.setProvider(ethereum);
			let web3 = new Web3(ethereum);
			try {
				const accounts = await ethereum.request({
					method: "eth_requestAccounts",
				});
				const networkId = await ethereum.request({
					method: "net_version",
				});
				if (networkId == CONFIG.NETWORK.ID) {
					const SmartContractObj = new Web3EthContract(
						abi,
						CONFIG.CONTRACT_ADDRESS
					);
					dispatch(
						connectSuccess({
							account: accounts[0],
							smartContract: SmartContractObj,
							web3: web3,
						})
					);
					// Add listeners start
					ethereum.on("accountsChanged", (accounts) => {
						dispatch(updateAccount(accounts[0]));
					});
					ethereum.on("chainChanged", () => {
						window.location.reload();
					});
					// Add listeners end
				} else {
					dispatch(connectFailed(`Change network to ${CONFIG.NETWORK.NAME}.`));
				}
			} catch (err) {
				dispatch(connectFailed("Something went wrong."));
			}
		} else {
			dispatch(connectFailed("Install Metamask."));
		}
	};
};

export const updateAccount = (account) => {
	return async (dispatch) => {
		dispatch(updateAccountRequest({ account: account }));
		dispatch(fetchData(account));
	};
};

export const hasCachedProvider = () => {
	try {
		const { localStorage } = window;
		const cachedProvider = localStorage.getItem("cachedProvider");
		if (cachedProvider) {
			return true;
		}
		return false;
	} catch (err) {
		return false;
	}
}

export const disconnect = () => d => {
	localStorage.removeItem("cachedProvider");
	d({
		type: "DISCONNECTED"
	});
	window.location.reload();
}