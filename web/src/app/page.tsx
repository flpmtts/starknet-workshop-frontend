"use client";
import Head from "next/head";
import dynamic from "next/dynamic";
import {
  useBlockNumber,
  useAccount,
  useBalance,
  useContractRead,
  useContract,
  useContractWrite,
  useExplorer,
  useWaitForTransaction,
} from "@starknet-react/core";
import { BlockNumber } from "starknet";
import contractAbiERC20 from "../abis/abi_erc20.json";
import { useState, useMemo } from "react";

const WalletBar = dynamic(() => import("../components/WalletBar"), {
  ssr: false,
});
const Page: React.FC = () => {
  // Step 1 --> Read the latest block -- Start
  const {
    data: blockNumberData,
    isLoading: blockNumberIsLoading,
    isError: blockNumberIsError,
  } = useBlockNumber({
    blockIdentifier: "latest" as BlockNumber,
  });
  const workshopEnds = 168999;
  // Step 1 --> Read the latest block -- End

  // Step 2 --> Read your balance -- Start
  const { address: userAddress } = useAccount();
  const {
    isLoading: balanceIsLoading,
    isError: balanceIsError,
    error: balanceError,
    data: balanceData,
  } = useBalance({
    address: userAddress,
    watch: true,
  });

  // Step 2 --> Read your balance -- End

  // Step 3 --> Read from a contract -- Start
  const contractAddress =
    "0x05b50ea24d0f464904b995bcfaec029742cd8f1871e78781edbcbec4ecb5301f";

  const {
    data: readData,
    refetch: dataRefetch,
    isError: readIsError,
    isLoading: readIsLoading,
    error: readError,
  } = useContractRead({
    functionName: "balance_of",
    args: [userAddress ? userAddress : "0x0"],
    abi: contractAbiERC20,
    address: contractAddress,
    watch: true,
  });
  // Step 3 --> Read from a contract -- End

  // --> Read total supply -- start
  const {
    data: readTotalSupplyData,
    refetch: totalSupplyRefetch,
    isError: readIsTotalSupply,
    isLoading: readIsLoadingTotalSupply,
    error: readTotalSupplyError,
  } = useContractRead({
    functionName: "total_supply",
    args: [],
    abi: contractAbiERC20,
    address: contractAddress,
    watch: true,
  });
  // --> Read total supply -- end

  // Step 4 --> Write to a contract -- Start
  const [amount, setAmount] = useState(0);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Form submitted with amount ", amount);
    // TO DO: Implement Starknet logic here
    writeAsync();
  };

  // --> Transfer to a contract -- start
  const [recipient, setRecipient] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<number>(0);

  const { contract } = useContract({
    abi: contractAbiERC20,
    address: contractAddress,
  });

  const transferCalls = useMemo(() => {
    if (!contract || !recipient || !transferAmount) return [];
    return contract.populateTransaction["transfer"]!(recipient, {
      low: transferAmount,
      high: 0,
    });
  }, [contract, recipient, transferAmount]);

  const {
    writeAsync: transferAsync,
    data: transferData,
    isPending: transferIsPending,
  } = useContractWrite({
    calls: transferCalls,
  });

  const explorer = useExplorer();
  const {
    isLoading: transferWaitIsLoading,
    isError: transferWaitIsError,
    error: transferWaitError,
    data: transferWaitData,
  } = useWaitForTransaction({
    hash: transferData?.transaction_hash,
    watch: true,
  });

  const handleTranferSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    console.log("Form submitted with amount ", transferAmount);
    await transferAsync();
  };

  const buttonContentTransfer = () => {
    if (transferIsPending) {
      return <LoadingState message="Send..." />;
    }

    if (transferWaitIsLoading) {
      return <LoadingState message="Waiting for confirmation..." />;
    }

    if (transferWaitData && transferWaitData.status === "REJECTED") {
      return <LoadingState message="Transaction rejected..." />;
    }

    if (transferWaitData) {
      return "Transaction confirmed";
    }

    return "Send Transfer";
  };

  // --> Transfer to a contract -- end

  const calls = useMemo(() => {
    if (!userAddress || !contract) return [];
    return contract.populateTransaction["mint"]!(userAddress, {
      low: amount ? amount : 0,
      high: 0,
    });
  }, [contract, userAddress, amount]);
  const {
    writeAsync,
    data: writeData,
    isPending: writeIsPending,
  } = useContractWrite({
    calls,
  });

  const {
    isLoading: waitIsLoading,
    isError: waitIsError,
    error: waitError,
    data: waitData,
  } = useWaitForTransaction({ hash: writeData?.transaction_hash, watch: true });

  const LoadingState = ({ message }: { message: string }) => (
    <div className="flex items-center space-x-2">
      <div className="animate-spin">
        <svg
          className="h-5 w-5 text-gray-800"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
      <span>{message}</span>
    </div>
  );
  const buttonContent = () => {
    if (writeIsPending) {
      return <LoadingState message="Send..." />;
    }

    if (waitIsLoading) {
      return <LoadingState message="Waiting for confirmation..." />;
    }

    if (waitData && waitData.status === "REJECTED") {
      return <LoadingState message="Transaction rejected..." />;
    }

    if (waitData) {
      return "Transaction confirmed";
    }

    return "Send";
  };

  // Step 4 --> Write to a contract -- End

  return (
    <div className="h-screen flex flex-col justify-center items-center">
      <Head>
        <title>Frontend Workshop</title>
      </Head>
      <div className="flex flex-row mb-4">
        <WalletBar />
      </div>

      {/* Step 1 --> Read the latest block -- Start */}
      {!blockNumberIsLoading && !blockNumberIsError && (
        <div
          className={`p-4 w-full max-w-md m-4 border-black border ${
            blockNumberData! < workshopEnds ? "bg-green-500" : "bg-red-500"
          }`}
        >
          <h3 className="text-2xl font-bold mb-2">Read the Blockchain</h3>
          <p>Current Block Number: {blockNumberData}</p>
          {blockNumberData! < workshopEnds
            ? "We're live on Workshop"
            : "Workshop has ended"}
        </div>
      )}
      {/* <div
        className={`p-4 w-full max-w-md m-4 border-black border bg-white`}
      >
        <h3 className="text-2xl font-bold mb-2">Read the Blockchain</h3>
        <p>Current Block Number: xyz</p>
        Are we live?
      </div> */}
      {/* Step 1 --> Read the latest block -- End */}

      {/* Step 2 --> Read your balance -- Start */}
      {!balanceIsLoading && !balanceIsError && (
        <div className={`p-4 w-full max-w-md m-4 bg-white border-black border`}>
          <h3 className="text-2xl font-bold mb-2">Read your Balance</h3>
          <p>Symbol: {balanceData?.symbol}</p>
          <p>Balance: {Number(balanceData?.formatted).toFixed(4)}</p>
        </div>
      )}
      {/* <div
        className={`p-4 w-full max-w-md m-4 bg-white border-black border`}
      >
        <h3 className="text-2xl font-bold mb-2">Read your Balance</h3>
        <p>Symbol: Ticker</p>
        <p>Balance: xyz</p>
      </div> */}
      {/* Step 2 --> Read your balance -- End */}

      {/* Step 3 --> Read from a contract -- Start */}
      <div className={`p-4 w-full max-w-md m-4 bg-white border-black border`}>
        <h3 className="text-2xl font-bold mb-2">Read your Contract</h3>
        <p>Balance: {readData?.toString()}</p>
        <div className="flex justify-center pt-4">
          <button
            onClick={() => dataRefetch()}
            className={`border border-black text-black font-regular py-2 px-4 bg-yellow-300 hover:bg-yellow-500`}
          >
            Refresh
          </button>
        </div>
      </div>
      {/* <div
        className={`p-4 w-full max-w-md m-4 bg-white border-black border`}
      >
        <h3 className="text-2xl font-bold mb-2">Read your Contract</h3>
        <p>Balance: xyz</p>
        <div className="flex justify-center pt-4">
          <button
            onClick={() => console.log("Refresh")}
            className={`border border-black text-black font-regular py-2 px-4 bg-yellow-300 hover:bg-yellow-500`}
          >
            Refresh
          </button>
        </div>
      </div> */}
      {/* Step 3 --> Read from a contract -- End */}

      {/* --> Read total supply -- start */}
      {!readIsLoadingTotalSupply && !readTotalSupplyError && (
        <div className={`p-4 w-full max-w-md m-4 bg-white border-black border`}>
          <h3 className="text-2xl font-bold mb-2">Read total supply</h3>
          <p>Total supply: {readTotalSupplyData?.toString()}</p>
          <div className="flex justify-center pt-4">
            <button
              onClick={() => totalSupplyRefetch()}
              className={`border border-black text-black font-regular py-2 px-4 bg-yellow-300 hover:bg-yellow-500`}
            >
              Refresh
            </button>
          </div>
        </div>
      )}
      {/* --> Read total supply -- end */}
      {/* Step 4 --> Write to a contract -- Start */}

      {/* Mint ERC20 Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 w-full max-w-md m-4 border-black border"
      >
        <h3 className="text-2xl font-bold mb-2">Mint ERC20</h3>
        <label
          htmlFor="amount"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Amount:
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(event) => setAmount(event.target.valueAsNumber)}
          className="block w-full px-3 py-2 text-sm leading-6 border-black focus:outline-none focus:border-yellow-300 black-border-p"
        />
        {writeData?.transaction_hash && (
          <a
            href={explorer.transaction(writeData?.transaction_hash)}
            target="_blank"
            className="text-blue-500 hover:text-blue-700 underline"
            rel="noreferrer"
          >
            Check TX on {explorer.name}
          </a>
        )}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className={`border border-black text-black font-regular py-2 px-4 ${
              userAddress ? "bg-yellow-300 hover:bg-yellow-500" : "bg-white"
            } `}
            disabled={!userAddress}
          >
            {buttonContent()}
          </button>
        </div>
      </form>

      {/* --> Transfer to a contract -- start */}
      <form
        onSubmit={handleTranferSubmit}
        className="bg-white p-4 w-full max-w-md m-4 border-black border"
      >
        <h3 className="text-2xl font-bold mb-2">Transfer ERC20 Tokens</h3>
        <label
          htmlFor="recipient"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Recipient Address:
        </label>
        <input
          type="text"
          id="recipient"
          value={recipient}
          onChange={(event) => setRecipient(event.target.value)}
          className="block w-full px-3 py-2 text-sm leading-6 border-black focus:outline-none focus:border-yellow-300 black-border-p"
          placeholder="0x..."
        />
        <label
          htmlFor="transferAmount"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Amount:
        </label>
        <input
          type="number"
          id="transferAmount"
          value={transferAmount}
          onChange={(event) => setTransferAmount(event.target.valueAsNumber)}
          className="block w-full px-3 py-2 text-sm leading-6 border-black focus:outline-none focus:border-yellow-300 black-border-p"
          placeholder="Amount"
        />
        {transferData?.transaction_hash && (
          <a
            href={explorer.transaction(transferData?.transaction_hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 text-sm text-blue-600 hover:inderline"
          >
            View Transation
          </a>
        )}

        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className={`border border-black text-black font-regular py-2 px-4 ${
              userAddress ? "bg-yellow-300 hover:bg-yellow-500" : "bg-white"
            }`}
            disabled={!userAddress}
          >
            {buttonContentTransfer()}
          </button>
        </div>
      </form>
      {/* --> Transfer to a contract -- end */}

      {/* <form onSubmit={handleSubmit} className="bg-white p-4 w-full max-w-md m-4 border-black border">
        <h3 className="text-2xl font-bold mb-2">Write to a Contract</h3>
        <label
          htmlFor="amount"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Amount:
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(event) => setAmount(event.target.valueAsNumber)}
          className="block w-full px-3 py-2 text-sm leading-6 border-black focus:outline-none focus:border-yellow-300 black-border-p"
        />
        <a
          href={"https://x.com/0xNestor"}
          target="_blank"
          className="text-blue-500 hover:text-blue-700 underline"
          rel="noreferrer">Check TX on an explorer</a>
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className={`border border-black text-black font-regular py-2 px-4 bg-yellow-300 hover:bg-yellow-500`}
          >
            Send
          </button>
        </div>
      </form> */}
      {/* Step 4 --> Write to a contract -- End */}
    </div>
  );
};

export default Page;