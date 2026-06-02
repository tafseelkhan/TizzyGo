// utils/shareMessages.ts
export const shareMessages = {
  getRandomMessage: (productTitle: string): string => {
    const messages = [
      // ===== ORIGINAL 4 =====
      `🔥 **EXCLUSIVE FIND ALERT!** 🔥\n\nJust discovered this absolutely incredible product on TizzyGo and I had to share it with you! 🎯 "${productTitle}" is genuinely one of the best products I've come across in a long time. The quality, design, and value are simply outstanding! Perfect for anyone looking to elevate their daily experience. Don't miss out on this amazing opportunity – check it out now!\n\nFull product details available here:`,

      `💡 **LIFESTYLE UPGRADE DISCOVERY!** 💡\n\nHey! I stumbled upon something truly special that I think you'd absolutely love! "${productTitle}" is currently trending on TizzyGo and for all the right reasons! This product combines innovative technology with user-friendly design to create something truly remarkable. Whether you're shopping for yourself or looking for the perfect gift, this is definitely worth exploring. Trust me, you don't want to miss this one!\n\nExplore this amazing product here:`,

      `🎉 **CAN'T-MISS OPPORTUNITY!** 🎉\n\nAttention everyone! "${productTitle}" is taking TizzyGo by storm and creating a major buzz in the shopping community! This isn't just another product – it's a complete game-changer that's redefining quality standards. I've been researching similar items for weeks, and this one stands out in every possible way. The features, the craftsmanship, and the overall value are absolutely unparalleled!\n\nSee what all the excitement is about:`,

      `✨ **PREMIUM PRODUCT SPOTLIGHT!** ✨\n\nI just found what might be the perfect addition to your collection! "${productTitle}" is currently available on TizzyGo, and it's genuinely impressive. What makes this product exceptional is its attention to detail, superior materials, and innovative design approach. It's receiving rave reviews from early adopters and has already become a favorite among savvy shoppers who appreciate quality and style.\n\nDiscover this premium selection:`,

      // ===== DEALS & SAVINGS =====
      `💰 **BUDGET FRIENDLY BOMB!** 💰\n\nListen, I don't usually share shopping finds, but THIS is different! "${productTitle}" on TizzyGo is selling at a price that feels like a GLITCH in the matrix! Same quality as expensive brands, but at almost half the price! My wallet is thanking me, and yours will too! Perfect timing if you're trying to save money without compromising on quality!\n\nGrab this deal before the price goes up:`,

      `🏷️ **FLASH SALE DISCOVERY!** 🏷️\n\nSTOP EVERYTHING! I just checked TizzyGo and "${productTitle}" is part of their SECRET flash sale! The discount is CRAZY - literally unreal! Usually I'd say "sleep on it" but NOT TODAY! These deals disappear faster than you can blink!\n\nCheck the price before the sale ends:`,

      `💸 **STEAL OF THE MONTH!** 💸\n\nI've been tracking prices for weeks, and THIS is the lowest I've ever seen! "${productTitle}" on TizzyGo is an absolute STEAL right now! If you've been waiting for a sign to buy, THIS IS IT! Don't overpay elsewhere when you can get it here for way less!\n\nLock in this price:`,

      // ===== EMOTIONAL / RELATABLE =====
      `😭 **FINALLY FOUND THE ONE!** 😭\n\nYou know that feeling when you've been searching for something for MONTHS and you almost gave up? YEAH, THAT FEELING! I finally found "${productTitle}" on TizzyGo and I'm literally emotional right now! It's like this product was made keeping ME in mind! If you've been struggling with the same problem, trust me - this is your SOLUTION!\n\nSee why I'm crying tears of joy:`,

      `🤝 **TRUST ME ON THIS ONE!** 🤝\n\nI'm not the type to force products on people. But "${productTitle}" on TizzyGo? I HAD to share! I've bought 3 similar products before and returned ALL of them. This one? PERFECT on the first try! The quality, the feel, the performance - EVERYTHING is top tier! If I don't tell you, who will?\n\nGet the product I actually trust:`,

      `💔 **RETURNED 5 PRODUCTS... FINALLY HAPPY!** 💔\n\nTrue story: I ordered and returned FIVE similar items from different sites. Either quality was cheap, or design was ugly, or it just didn't work. Then I found "${productTitle}" on TizzyGo and FINALLY something that DELIVERS! No more compromise, no more disappointment.\n\nEnd your search here:`,

      `🥺 **LITERALLY ME RIGHT NOW:** 🥺\n\n*Orders product* ✅\n*Waits impatiently* ⏰\n*Arrives* 📦\n*MINDS BLOWN* 🤯\n\nThat's the "${productTitle}" experience on TizzyGo! I wasn't expecting much, but WOW - just WOW! Sometimes the best purchases are the ones you least expect!\n\nExperience the surprise:`,

      // ===== URGENCY / FOMO =====
      `⏰ **LAST CHANCE!** ⏰\n\nI'm not joking when I say this - "${productTitle}" on TizzyGo is down to its LAST FEW PIECES! I checked the stock and it's moving FAST! Once it's gone, it's GONE gone! No restock announced yet! If you've been thinking about it, stop thinking and start clicking! Regret is expensive, this product is NOT!\n\nRun before it vanishes:`,

      `📢 **PUBLIC SERVICE ANNOUNCEMENT!** 📢\n\nI have a DUTY to tell you about "${productTitle}" on TizzyGo! This is one of those products that makes you go "why didn't I buy this sooner?!" Don't be that person who finds out about it AFTER it's sold out! I've seen this happen too many times! Be early, be smart!\n\nThank me later:`,

      `🚨 **ALMOST SOLD OUT!** 🚨\n\nNot trying to create unnecessary panic, but... OKAY MAYBE I AM! "${productTitle}" on TizzyGo has ONLY 47 units left as I'm typing this! By the time you read this, it might be even LESS! These viral products don't last long - ask anyone who missed out last time!\n\nCheck stock before it's too late:`,

      // ===== GIFTING =====
      `🎁 **PERFECT GIFT UNLOCKED!** 🎁\n\nGift shopping is a STRUGGLE. Especially when you want something NICE but not TOO expensive. Enter "${productTitle}" from TizzyGo! It's thoughtful, it's useful, and it looks way more expensive than it actually is! Perfect for birthdays, anniversaries, or even just a "thinking of you" moment!\n\nSteal my gift idea:`,

      `👪 **FAMILY APPROVED!** 👪\n\nYou know a product is good when your WHOLE family fights over it! I bought "${productTitle}" from TizzyGo and now mom wants one, dad is secretly using mine, and my sibling is demanding their own! If that's not a 10/10 review, I don't know what is! Get ready for family arguments (the good kind)!\n\nBring peace to your home:`,

      `🎀 **GIFT WRAPPED AND READY!** 🎀\n\nStop stressing about what to give! "${productTitle}" on TizzyGo is the answer to all your gifting nightmares! It's universally loved, actually useful, and arrives in beautiful packaging! Whether it's for Christmas, a wedding, or just because - this will make anyone's day!\n\nSave yourself the headache:`,

      // ===== SMART / PRACTICAL =====
      `🧠 **BIG BRAIN PURCHASE!** 🧠\n\nSome purchases are EMOTIONAL. This one is STRATEGIC. "${productTitle}" on TizzyGo isn't just a product - it's an INVESTMENT in your daily happiness! Do the math: cost per use, durability, time saved, stress reduced. It's a NO BRAINER! Smart people make smart choices, and this is the smartest choice I've made all year!\n\nJoin the smart shopper club:`,

      `📊 **COMPARISON CHAMPION!** 📊\n\nI did the homework so you don't have to! Compared "${productTitle}" with 8 other similar products from other platforms. RESULT? TizzyGo WINS by a MARGIN! Better quality, better price, better service. The data doesn't lie! Why gamble when you can go with the PROVEN winner?\n\nSee the comparison yourself:`,

      `🔍 **RESEARCH COMPLETE!** 🔍\n\nAfter 3 weeks of research, 47 video reviews watched, and 12 comparison tables made... I can CONFIDENTLY say "${productTitle}" on TizzyGo is the BEST in its category! My inner researcher is screaming with joy! No more analysis paralysis - just buy this one!\n\nTrust the research:`,

      // ===== FUNNY / CASUAL =====
      `🤡 **ME EXPLAINING MY 10th PURCHASE THIS MONTH:** 🤡\n\nMy wallet: "Please stop."\nMe: "But look at "${productTitle}" on TizzyGo!"\nMy wallet: "...fine, you win."\n\nJokes aside, this is genuinely TOO GOOD to pass up! I'm not saying I have a shopping problem, but if I do - this product is totally worth it! Join my bad decision (actually GOOD decision)!\n\nEnable me here:`,

      `🧃 **POV: YOU FOUND THE ONE** 🧃\n\n*Adds to cart* ✅\n*Checks reviews* ✅\n*Compares prices* ✅\n*Buys immediately* ✅\n\nThat's the journey with "${productTitle}" from TizzyGo! No second-guessing, no "maybe later", just pure CONFIDENCE! This is that product that makes online shopping feel like a WIN instead of a gamble!\n\nExperience the W:`,

      `😎 **I'LL NEVER SHUT UP ABOUT THIS** 😎\n\nFair warning: I just bought "${productTitle}" from TizzyGo and I'm about to become THAT person who mentions it in every conversation! "Did I tell you about my new product?" "Let me show you what I got!" "You NEED this in your life!" Sorry in advance, but also... not sorry!\n\nJoin my obsession:`,

      // ===== QUALITY / LUXURY =====
      `💎 **LUXURY FOR LESS!** 💎\n\nI'm someone who notices DETAILS. Stitching, finish, material, feel - I'm PICKY! And "${productTitle}" on TizzyGo PASSES every test with flying colors! It FEELS premium, LOOKS expensive, but costs SURPRISINGLY less! If you're like me and refuse to compromise on quality, this is your MOMENT!\n\nTreat yourself:`,

      `👑 **MAIN CHARACTER ENERGY!** 👑\n\nBuying "${productTitle}" from TizzyGo gave me instant main character energy! Like suddenly I have my life together, my style is on point, and I'm THAT person who always has the best stuff! Sounds dramatic? Maybe. But also TRUE! Upgrade your energy with this one simple purchase!\n\nGet your main character moment:`,

      `🌟 **PREMIUM WITHOUT THE PRICE TAG!** 🌟\n\nUsually when something is affordable, you expect to compromise on quality. NOT WITH THIS! "${productTitle}" on TizzyGo delivers PREMIUM experience at a REGULAR price! The materials, the craftsmanship, the finish - everything screams luxury! Your friends will ask "how much did THIS cost?" and they won't believe your answer!\n\nLive the premium life:`,

      // ===== SOCIAL PROOF =====
      `🗣️ **WHAT EVERYONE IS TALKING ABOUT!** 🗣️\n\nHave you seen "${productTitle}" trending on TizzyGo? If not, WHERE HAVE YOU BEEN?! Everyone and their mother is buying this right now! Thousands of reviews, hundreds of photos, and NOT ONE regret! When a product goes viral for the RIGHT reasons, you PAY ATTENTION!\n\nSee what the hype is about:`,

      `⭐ **5000+ REVIEWS CAN'T BE WRONG!** ⭐\n\nI'm usually skeptical of trending products. Like "is this actually good or just good marketing?" But "${productTitle}" on TizzyGo has 5000+ reviews with a 4.9 AVERAGE! That's INSANE consistency! Real people, real happiness, real results. Numbers don't lie, and these numbers are SCREAMING "BUY ME"!\n\nJoin 5000+ happy customers:`,

      `📣 **JOIN THE MOVEMENT!** 📣\n\nAt first I thought "it can't be THAT good." Then I saw 3000+ people raving about "${productTitle}" on TizzyGo. Then I bought it. THEN I UNDERSTOOD. Now I'm one of those people! Don't be the last to know - join the thousands of happy customers!\n\nSee what everyone's excited about:`,

      // ===== SEASONAL =====
      `🎄 **BEST THING I BOUGHT THIS SEASON!** 🎄\n\nThis festive season, I've bought a LOT of things (don't judge me). But "${productTitle}" from TizzyGo is hands-down the BEST purchase I made! Whether it's for gifting or treating yourself, this is THAT product that makes everything better! End the season on a high note!\n\nEnd your year right:`,

      `🌟 **BEST DISCOVERY OF THE YEAR!** 🌟\n\nWe're a few months into the year and I've already found my BEST DISCOVERY - "${productTitle}" on TizzyGo! Mark my words, this product is going to be everywhere by the end of the year! Get ahead of the curve and be THAT friend who finds things FIRST!\n\nBe a trendsetter here:`,

      // ===== EXTRA BOOSTERS =====
      `🎯 **STOP SCROLLING!** 🎯\n\nYes, YOU! The person reading this right now! This is your sign! "${productTitle}" on TizzyGo is waiting for you! The universe, fate, destiny - whatever you believe in - is telling you to check this out! Don't ignore the signs!\n\nAnswer the call:`,

      `🔥 **THIS IS NOT A DRILL!** 🔥\n\nRepeat: THIS IS NOT A DRILL! "${productTitle}" on TizzyGo is the real deal! No hype, no exaggeration, no marketing fluff - just a genuinely AMAZING product that delivers on every promise! I don't get excited about much, but THIS has me jumping up and down!\n\nSee what got me so excited:`,

      `💪 **GAME CHANGER!** 💪\n\nBefore "${productTitle}", my life was... fine. AFTER "${productTitle}"? SO MUCH BETTER! I didn't know I needed this until I had it! Now I can't imagine going back! Some products are nice to have. This one is a MUST have!\n\nUpgrade your life:`,
    ];

    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  },

  getFooter: (): string => {
    return `\n\n📱 **Platform:** TizzyGo Mobile App\n⭐ **Rating:** Currently receiving excellent reviews!\n💬 **Community Feedback:** Overwhelmingly positive!\n\n#TizzyGo #SmartShopping #ProductDiscovery #QualityFinds #ShoppingGoals #Innovation #PremiumProducts #MustHaveItems #TrendingNow #ShoppingCommunity`;
  },

  getCompleteShareText: (productTitle: string, shareUrl: string): string => {
    const message = shareMessages.getRandomMessage(productTitle);
    const footer = shareMessages.getFooter();
    return `${message}\n\n🔗 **Product Link:** ${shareUrl}${footer}`;
  },
};
