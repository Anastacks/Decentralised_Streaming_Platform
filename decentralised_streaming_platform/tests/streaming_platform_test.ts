
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Administrative Functions Tests
Clarinet.test({
    name: "Ensure that admin functions are protected and work correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const deployer = accounts.get("deployer")!;
        const wallet1 = accounts.get("wallet_1")!;

        // Test setting platform fee as owner
        let block = chain.mineBlock([
            Tx.contractCall("streaming_platform", "set-platform-fee",
                [types.uint(10)],
                deployer.address
            )
        ]);
        assertEquals(block.receipts[0].result, '(ok true)');

        // Test setting platform fee as non-owner (should fail)
        block = chain.mineBlock([
            Tx.contractCall("streaming_platform", "set-platform-fee",
                [types.uint(10)],
                wallet1.address
            )
        ]);
        assertEquals(block.receipts[0].result, '(err u100)'); // ERR-NOT-AUTHORIZED

        // Test setting platform owner
        block = chain.mineBlock([
            Tx.contractCall("streaming_platform", "set-platform-owner",
                [types.principal(wallet1.address)],
                deployer.address
            )
        ]);
        assertEquals(block.receipts[0].result, '(ok true)');
    }
});
