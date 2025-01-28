
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

// Content Publishing Tests
Clarinet.test({
    name: "Ensure content publishing works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const creator = accounts.get("wallet_1")!;

        // Publish normal content
        let block = chain.mineBlock([
            Tx.contractCall("streaming_platform", "publish-content",
                [
                    types.uint(1), // content-id
                    types.ascii("Test Content"), // title
                    types.ascii("Test Description"), // description
                    types.uint(100), // price
                    types.bool(false), // is-nft
                    types.ascii("Music"), // category
                    types.bool(false) // is-premium
                ],
                creator.address
            )
        ]);
        assertEquals(block.receipts[0].result, '(ok true)');

        // Try publishing with same content ID (should fail)
        block = chain.mineBlock([
            Tx.contractCall("streaming_platform", "publish-content",
                [
                    types.uint(1), // Same content-id
                    types.ascii("Different Content"),
                    types.ascii("Different Description"),
                    types.uint(100),
                    types.bool(false),
                    types.ascii("Music"),
                    types.bool(false)
                ],
                creator.address
            )
        ]);
        assertEquals(block.receipts[0].result, '(err u101)'); // ERR-CONTENT-EXISTS
    }
});
