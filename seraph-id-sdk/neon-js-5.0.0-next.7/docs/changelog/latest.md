---
id: latest
title: Changelog (v5)
---

# 5.0.0
## RC1

```
neo-cli: v3.0.0-rc1
neon-js: v5.0.0-next7
```

Key blockchain changes:
- Smart contract hashes are determined in a new way causing all native contract hashes to change.
- Neo address format has changed.
- Smart contract execution fees have changed.
- JSON, Binary and most Crypto SYSCALLs have been moved to `StdLib` and `CryptoLib` native smart contracts.

SDK changes:
- sc
  - `NEO_BINARY_*` and `NEO_JSON_*` SYSCALLs removed.
  - Old `NEO_CRYPTO_*` SYSCALLs removed.  Introduced two new SYSCALLs `NEO_CRYPTO_CHECKSIG` & `NEO_CRYPTO_CHECKMULTISIG`.
  - Transaction `networkfee` and `systemfee` representation changed to be without decimals.
- u
  - `isMultisigContract` and `isSignatureContract` helpers updated to new format changes.
- wallet
  - Updated signature and multisignature contract scripts to structure changes and using the new crypto syscalls.

## Preview5:

```
neo-cli: v3.0.0-preview5
neon-js: v5.0.0-next6
```

Key blockchain changes:
- Smart contract hashes are determined in a new way causing all native contract hashes to change.
- More RPC methods results been streamlined to return base64 values requiring interface updates.
- Gas consumption results in RPC calls are no longer returned as decimal values.
- Contract calling function signatures changed requiring modification of the transaction builder.

SDK changes:
- rpc
   - Rename `getApplicationLogs` to `getApplicationLog`.
   - `ApplicationLog` interface changed to move the majority of properties under the `executions` array.
   - The `key` parameter to getStorage needs to be hex encodable. The return value is now base64 encoded.
   - `getContractState` no longer returns `script` as a key in its result. Instead, it returns a `nef` key describing the smart contract including the `script`.

- sc
  - Neo Executable Format (NEF) class has been added. This allows loading compiled contracts from disk and inspect or deploy them.


## Preview4:

```
neo-cli: v3.0.0-preview4
neon-js: v5.0.0-next5
```

Key blockchain changes:

- Prices for VM operations are now adjusted to be dynamic. It is now a baseline
  price multiplied by PolicyContract's GetExecFee.
- Contract deployment is now managed by a native contract.
- NEP17 is now the new token standard superseding NEP5.


SDK changes:

`neon-core` and `neon-api` is now supported and usable for this preview stage.

- Misc

  - GAS claim is now more complicated, sending NEO to the same address does not
    give you GAS anymore. Currently, this function is not supported until
    further notice. If you want to claim gas, just have 2 addresses and send NEO
    between both addresses.
  - Removal of the Nep5 package. The functionality is now absorbed into the `sc`
    package as tokens become part of the native functionality.
  - Nep5 is now deprecated in favor of Nep17. The new standard removes `name`,
    adjusts `transfer` and adds some new functionality.
  - Fees are now more dynamic. It now uses data from PolicyContract as a
    multiplier to the execution price.

- api

  - NetworkFacade is the new high level API class that is intended to make
    common wallet operations easy to use. It will contain the following methods:

    - transferToken
    - getTokenInfos
    - getTokenBalances
    - getFeeInformation

  - TransactionBuilder is a utility class for building transaction templates.
    This will help create transactions based on intents provided. Currently only
    supports token transfer.

  - TransactionValidator is a class working in tandem with TransactionBuilder to
    validate and autofill other portions of the transaction that requires a
    network connection. For example, both fees require blockchain assistance in
    determining the correct fees.

- u

  - Fixed8 is now deprecated. BigInteger is the new replacement for this class.
    BigInteger will allow for bigger numbers and less messing around with the
    fixed convention of 8 decimals. Internally, the SDK will try to represent
    and move data around as integers since the decimals is merely an arbitrary
    precision data contained within the contract.

- tx

  - Reduce max transaction lifespan down to 24 hours (based on 15s blocks).

- rpc

  - Reworked base class into RpcDispatcher that uses mixins to create suitable
    clients. This allows typings to be more specific for certain cases where
    only a subset of the RPC methods are required.
  - Invoke\* methods and transaction methods now use base64 encoding for
    transmission of data.
  - rename getValidators to getNextBlockValidators
  - getVersion is updated to return the full payload (previously it only
    returned the version string). This allows users to access the magic number
    inside this payload which will be needed to sign transactions.

- sc

  - OpToken is introduced to wrap OpCode. This allows for better parsing of VM
    scripts.
  - Introduce a better typed interface ContractCall. This replaces the old
    ScriptIntent with the primary goal of making the arguments easier to
    translate into proper VM script format.
  - Remove ScriptParser in favor of using OpToken.
  - Renamed Nep5Contract to Nep17Contract. Most of the original Nep5 methods
    remain unchanged with the exception of the removal of the `name` method.
  - Removed contract deployment code. We are testing it out in experimental at
    the moment.

- wallet

  - Implement WIF format natively to reduce dependency.

- CONST

  - Deprecate ASSET_ID in favor of NATIVE_CONTRACT_HASH. Asset as a term is
    pretty much deprecated in neo3.

- experimental

  - new section under neon-js to test out a different way of doing things.
    Contract deployment and some basic api functions are available. Please look
    at the readme found within the src folder for more details.

## Preview3:

```
neo-cli v3.0.0-preview3
neon-js: v5.0.0-next4
```

Key blockchain changes:

- Another update of InteropServiceCode. This means that all scripthashes,
  addresses and encrypted keys from preview2 are invalid and will need to be
  regenerated.
- Transaction.cosigners is now renamed to signers. The sender field is now
  inferred from the first Signer.
- Codebase wide changes for json field name convention. Field names are now
  lowercased without seperators (previously it was lower case with underscores).
- Add support for SECP256K1 curve (same elliptic curve used in bitcoin).

SDK changes:

As usual, only `neon-core` will be updated and usable during the preview stage.

- Misc

  - Enforce ts-lint for docstrings throughout the codebase.

- tx

  - The `cosigners` field is now `signers`. Deserialization order has changed.
  - The `sender` field is now inferred as the first `signer`. It is now not
    included in the transaction serialization.
  - Updated WitnessScope enum to include the FeeOnly enum. Integer ordering has
    also changed.

- sc

  - Updated codes for OpCodes and InteropServiceCodes.
  - Updated interfaces for ContractParamType, StackItem enum types. Integer
    ordering for both types have changed.
  - Removed serialization of StackItem. Added toJson support.
  - Update ContractManifest and its related classes.

- rpc

  - Updated fields to use lowercased strings with no separators. This should not
    have any effect internally as neon-js will continue to use camelCase.

## Preview2:

```
neo-cli: v3.0.0-preview2
neon-js: v5.0.0-next3
```

Key blockchain changes:

- Change of address prefix. Now all addresses produced will start with `N`.
- Total revamp of OpCode and InteropServiceCode. All previous scripts are
  invalid.
- Signing of transaction now involves the magic number of the network. This
  makes transaction witnesses unique across the different networks (You cannot
  take a transaction from MainNet and replay it on TestNet. This was possible
  when UTXO was removed.)
-

SDK changes:

Due to the large number of changes ongoing, only `neon-core` will be fully
functional and maintained.

- Misc

  - Establish testing for Node 10 and Node 12.

- tx

  - Renamed `scripts` field to `witnesses` field
  - `Transaction.sign` now takes an optional magic number argument to sign.
  - Add support for reading JSON outputs from neo RPC endpoints.
  -

- sc

  - `OpCode` is now an int enum (previously string)
  - `ScriptBuilder.emitString` now accepts a UTF8 string instead of hexstring.
    Please use `emitHexstring` for hex. This makes the distinction when emitting
    strings clearer.
  - Make public the various methods on ScriptBuilder for emitting different data
    types. Please avoid `emitPush` as it is too overloaded and may cause
    unexpected consequences.
  - Add a `ScriptBuilder.build` function to return a copy of the script
    (replaces the `.str` getter)

- rpc

  - Update methods to match preview2 methods. This removes getBlockSysFee. The
    rest received some data structure changes.
  - Optional verbose paramters now accepts booleans.
  - Amend getVersion to read the keys correctly.

- wallet

  - Account generation now uses the new address prefix of `0x35`.
  - Witness generation is updated to use the new OpCodes.
  - VerificationScript generation is also updated to match preview2.

* u

  - Add support for encoding and decoding between hexstrings and base64. This is
    used to send data over RPC.

## Preview1:

```
neo-cli: v3.0.0-preview1
neon-js: v5.0.0-next2
```

Key blockchain changes:

- Removal of the UTXO system coupled with the integration of additional RPC
  methods on the neo node allowed for the wallet to operate without the need for
  a third party aggregator. Neon-api is now a high level API package.

- A change in the neoVM and the generation of scripts means a change in
  addresses. Private and public keys are the only things that remain unchanged
  from neo2. All other details (Scripthash, WIF, NEP2, Address) are different.

SDK changes:

- Neon-api

  - Removed all provider modules. We do not need to rely on neoscan for details
    in order to form transactions.
  - Introduced a new flow for transaction forming. Old flow is removed.
    - TransactionBuilder class for forming transactions. This follows the
      builder fluent pattern allowing chaining of methods to add data to the
      transaction. Most of the more friendly methods will be found on this class
      with the old methods migrating off the Transaction class.
    - TransactionValidator is a new step in the process. It helps validate the
      properties of the transaction by making rpc calls to the blockchain and
      making sure that the parameters are valid. It also provides suggestions
      whenever possible.
    - TransactionSigner is a basic class for signing the Transaction. This will
      replace the `sign` function on the Transaction class itself.

- Neon-core

  - tx

    - There is only one Transaction type now.
    - Added new fields:
      - nonce: Field to make transaction unique since there is no more UTXO.
      - validUntilBlock: expiry date for transactions in mempool.
      - systemFee and networkFee: Separate fields for each fee.
      - sender: Identity of the main signature.
      - cosigners: Identities of other parties involved. Comes with
        permissioning for contract calls.
    - Replaced `AddAttribute` method. It now only accepts an
      TransactionAttributeLike object. Old method is now on the builder.

  - sc

    - There is now OpCode and InteropCodes. OpCode are your basic computer
      instructions while InteropCodes are for more complex operations. Signature
      verification code is moved from OpCode to InteropCode. (This is the
      primary change that resulted in the change in addresses)
    - Add ScriptParser class to read script back into ScriptIntent.
    - Add ContractManifest class.

  - tx

    - Updated Account to generate the new scripthash.

  - u

    - Add Hexstring class to handle hexstrings. Capable of handling strings
      starting with `0x` prefix.

- Neon-js

  - Updated networks to connect to neo3 TestNet.