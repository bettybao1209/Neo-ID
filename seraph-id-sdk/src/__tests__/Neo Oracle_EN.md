# Neo Oracle Service

Oracle solves the problem that blockchain cannot obtain information from the external network. As a gateway for smart contracts to communicate with the outside world, Oracle opens a window to the outside world for blockchain. Oracle nodes will jointly verify the data fetched from the network, then smart contracts can query the result in the reponse transactions on the chain.

NEO Oracle Service is an out-of-chain data access service built into NEO 3.0. It allows users to request the external data sources in smart contracts, and Oracle nodes designated by the committee will access the specified data source then pass the result in the callback funtction to continue executing the smart contract logic.

![img](https://docs.neo.org/v3/docs/zh-cn/advanced/assets/oracle.png)

## Key mechanisms

### Commit-Reveal mechanism

The commit-reveal mechanism is a sequential protocol that prevents the data plagiarism for multiple Oracle nodes.

**Process**

1. Oracle node submits ciphertext information (hash, signature, etc.) about data to other Oracle nodes and collects ciphertext information submitted by other Oracle nodes.

   Neo Oracle Service adopts the multiple signatures on the Response transaction as the ciphertext information.

2. After collecting enough ciphertext information, Oracle nodes reveal the data to other Oracle nodes to verify the data.

   Accordingly, the revealed data in Neo Oracle Service is the Response transaction.

In this way we can avoid data plagiarism since oracle nodes cannot predict the data to submit ciphertext information.

![](C:\neo-project\docs\docs\zh-cn\advanced\assets\oracle_commit.png)

### Request-Response pattern

Neo Oracle Service adopts the request-response processing mechanism, which is an asynchronous pattern.

![](C:\neo-project\docs\docs\zh-cn\advanced\assets\oralce_response.png)

**Process**

1. The user writes the smart constract to call the `Request` method of the Oracle contract.

Each successfully created Request is put in the Request cache list with an unique RequestId.

2. Oracle node listens for the requests in the Request cache list in real time, and accesses data sources specified in the Request to obtain data.

3. Oracle node processes the obtained data with the specified filter, and encapsulates the result into a `Response` transaction (including RequestId, data, fixedScript, multisig address, etc.).

The result data will be stored in the `TransactionAttribute` field of the Response transaction. The `fixedScript` in the transaction is used to call the `finish` method of the Oracle contract, which will execute the callback function `CallbackMethod`.

4. Oracle nodes independently sign the Response transaction through the commit-reveal mechanism.

5. The Response transaction with enough signatures will be stored on the chain, and the callback function will be executed.

## Protocol supports

- **https://**
- **neofs:**

## Fees and rewards

- **Fees**

  Neo Oracle Service charges the user by the number of requests, 0.5 GAS for each. Besides, the user has to pay additional fees for the callback function. All the fees will be paid when the Request is created.

- **Rewards**

The fee paid by the user for the Request is distributed to the Oracle node in turn when executing the `PostPersist` logic.

Distribution order = RequestId % count of Oracle nodes

## Example

Here is an demo about using the Oracle service：

```c#
using Neo.SmartContract.Framework;
using Neo.SmartContract.Framework.Services.Neo;
using System.ComponentModel;

namespace demo
{
    [DisplayName("Oracle Demo")]
    [ManifestExtra("Author", "Neo")]
    [ManifestExtra("Email", "dev@neo.org")]
    [ManifestExtra("Description", "This is a Oracle using template")]
    public class OracleDemo : SmartContract
    {
        static readonly string PreData = "RequstData";

        public static string GetRequstData()
        {
            return Storage.Get(Storage.CurrentContext, PreData);
        }

        public static void CreateRequest(string url, string filter, string callback, byte[] userData, long gasForResponse)
        {
            Oracle.Request(url, filter, callback, userData, gasForResponse);
        }

        public static void Callback(string url, byte[] userData, int code, byte[] result)
        {
            Storage.Put(Storage.CurrentContext, PreData, result.ToByteString());
        }
    }
}
```

As shown above, there are two key functions in the contract:

- `CreateRequest` function can create Oracle Request to request data

- `Callback` function is used to execute contract logic after the Oracle node fetches data

### Oracle request

The following fields are required for Oracle Request：

| Fields           | Type    | Desc                                                         |
| -------------- | --------- | ------------------------------------------------------------ |
| Url            | string    | the resource path, with a maximum length of 256 bytes                             |
| Filter         | string    | used to filter out useful information from the result returned from the data source. It is a JSONPath expression with a maximum length of 128 bytes. More information about JSONPath can be found [here](https://github.com/json-path/JsonPath) |
| CallbackMethod | string    | method name of callback function (cannot begin with "_"), with a maximum length of 32 bytes|
| UserData       | var bytes | the custom data                                              |
| GasForResponse | long      | the fee paid in advance for callback function to pay for executing the script in the Response transaction. The fee should not be less than 0.1 GAS and will be charged when creating the Oracle request transaction |

### Callback function

The type and order of the parameters of the callback function should exactly be the same as below:

| Field     | Type    | Desc                                      |
| -------- | --------- | ----------------------------------------- |
| Url      | string    | the resource path                                |
| UserData | var bytes | the custom data                            |
| Code     | byte      | status Code of the Oracle response, see the Code table for details. |
| Result   | var bytes | the result                                  |

### Code

The Code field defines the status Code for Oracle responses, including the following types:

| Value     | Status                   | Desc             | Type   |
| ------ | ---------------------- | ---------------- | ------ |
| `0x00` | `Success`              | execute successfully         | `byte` |
| `0x10` | `ProtocolNotSupported` | Unsupported protocol     | `byte` |
| `0x12` | `ConsensusUnreachable` | Oracle nodes did not reach a consensus | `byte` |
| `0x14` | `NotFound`             | requested information does not exist | `byte` |
| `0x16` | `Timeout`              | timeout         | `byte` |
| `0x18` | `Forbidden`            | no permission to query the data source       | `byte` |
| `0x1a` | `ResponseTooLarge`     | result size is out of limit | `byte` |
| `0x1c` | `InsufficientFunds`    | the fee is insufficient   | `byte` |
| `0xff` | `Error`                | error orrcurs in the execution         | `byte` |
