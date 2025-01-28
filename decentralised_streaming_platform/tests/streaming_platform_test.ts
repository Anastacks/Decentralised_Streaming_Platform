
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

// Subscription System Tests
Clarinet.test({
    name: "Ensure subscription system works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const creator = accounts.get("wallet_1")!;
        const subscriber = accounts.get("wallet_2")!;

        // Subscribe to creator
        let block = chain.mineBlock([
            Tx.contractCall("streaming_platform", "subscribe-to-creator",
                [
                    types.principal(creator.address),
                    types.uint(30), // 30 days duration
                    types.ascii("premium") // subscription type
                ],
                subscriber.address
            )
        ]);
        assertEquals(block.receipts[0].result, '(ok true)');

        // Try subscribing again (should fail)
        block = chain.mineBlock([
            Tx.contractCall("streaming_platform", "subscribe-to-creator",
                [
                    types.principal(creator.address),
                    types.uint(30),
                    types.ascii("premium")
                ],
                subscriber.address
            )
        ]);
        assertEquals(block.receipts[0].result, '(err u106)'); // ERR-ALREADY-SUBSCRIBED

        // Check subscription status
        let result = chain.callReadOnlyFn(
            "streaming_platform",
            "get-subscription-status",
            [
                types.principal(subscriber.address),
                types.principal(creator.address)
            ],
            subscriber.address
        );

        // Should return active subscription
        assertEquals(result.result.includes('is-active: true'), true);
    }
});


// Content Rating Tests
Clarinet.test({
    name: "Ensure content rating system works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const creator = accounts.get("wallet_1")!;
        const user1 = accounts.get("wallet_2")!;

        // First publish content
        let block = chain.mineBlock([
            Tx.contractCall("streaming_platform", "publish-content",
                [
                    types.uint(1),
                    types.ascii("Test Content"),
                    types.ascii("Test Description"),
                    types.uint(100),
                    types.bool(false),
                    types.ascii("Music"),
                    types.bool(false)
                ],
                creator.address
            )
        ]);

        // Rate content
        block = chain.mineBlock([
            Tx.contractCall("streaming_platform", "rate-content",
                [
                    types.uint(1), // content-id
                    types.uint(5) // 5-star rating
                ],
                user1.address
            )
        ]);
        assertEquals(block.receipts[0].result, '(ok true)');

        // Try rating again (should fail)
        block = chain.mineBlock([
            Tx.contractCall("streaming_platform", "rate-content",
                [types.uint(1), types.uint(4)],
                user1.address
            )
        ]);
        assertEquals(block.receipts[0].result, '(err u110)'); // ERR-ALREADY-RATED
    }
});

// Playlist Management Tests
Clarinet.test({
    name: "Ensure playlist management works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)
    {
        const user1 = accounts.get("wallet_1")!;
        const creator = accounts.get("wallet_2")!;

        // First publish some content
        let block = chain.mineBlock([
            Tx.contractCall("streaming_platform", "publish-content",
                [
                    types.uint(1),
                    types.ascii("Test Content"),
                    types.ascii("Test Description"),
                    types.uint(100),
                    types.bool(false),
                    types.ascii("Music"),
                    types.bool(false)
                ],
                creator.address
            )
        ]);

        // Create playlist
        block = chain.mineBlock([
            Tx.contractCall("streaming_platform", "create-playlist",
                [
                    types.uint(1), // playlist-id
                    types.ascii("My Playlist"),
                    types.bool(true) // is-public
                ],
                user1.address
            )
        ]);
        assertEquals(block.receipts[0].result, '(ok true)');

        // Add content to playlist
        block = chain.mineBlock([
            Tx.contractCall("streaming_platform", "add-to-playlist",
                [
                    types.uint(1), // playlist-id
                    types.uint(1) // content-id
                ],
                user1.address
            )
        ]);
        assertEquals(block.receipts[0].result, '(ok true)');
    }
});


