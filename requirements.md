# 要件定義書：分散型コラボレーションアプリ「athub (仮)」

## 1. プロジェクト概要

**コンセプト:** 「大衆向けのGitHub」×「過程の肯定」
「何者かにならなければならない」という現代の強迫観念からユーザーを解放し、非IT領域を含む日常のあらゆる「プロジェクト（取り組み）」と、そこへの「貢献（過程）」を可視化・肯定する。AT Protocolを基盤とし、特定のプラットフォームに依存しない、ユーザー自身のポータブルな社会的価値（ソーシャルキャピタル）を構築する。

## 2. 対象ユーザー

* 学生（インターン志望者や、社会との接点を探している層）
* 若手社会人（業務外での緩やかな繋がりや自己実現を求めている層）
* スキル向上や習慣化を目指す個人
* 地域活動やオープンな協働プロジェクト（Quest）に参加・貢献したい人

## 3. コア概念（メタファーとUIマッピング）

裏側のデータ構造（Lexicon）はGitの堅牢なバージョン管理の思想を踏襲しつつ、ユーザーが触れるUI上ではIT用語を徹底的に排除し、温かみのある言葉に翻訳する。

| UI上の呼称 | Lexicon (裏側のデータ構造) | 役割・メタファー |
| --- | --- | --- |
| **Quest（クエスト）** | `app.athub.repo` | プロジェクトや習慣の器。目指す方向性を示す場所。 |
| **Proposal（提案）** | `app.athub.issue` | 議論、アイデア出し、課題の共有を行う場。 |
| **Contribution（貢献）** | `app.athub.commit` | 実際の行動記録。コードだけでなく、アナログな作業や調査も含む。 |
| **Badge（バッジ）** | `app.athub.award` | 貢献や提案に対する、他者からの静かで確かな承認・感謝。 |

## 4. ユーザー体験（UX）フロー

「議論で合意形成し、行動で前進し、互いを承認する」サイクルを回す。

1. **Questの立ち上げ:** 発起人が「空き家をDIYして図書室を作る」などのQuestを作成し、ビジョンを掲げる。
2. **Proposalの提出と合意形成 (DDS連携):** 参加者が自由にアイデア（Proposal）を投稿する。意見が多数集まった場合、**DDS（Decentralized Deliberation Standard）のAnalyzer Agent**が意見をクラスタリング・分析し、声の大きさに関わらない公平で納得感のある合意形成をサポートする。
3. **Contributionによる実行:** 決定事項に基づき、参加者が実作業（ペンキ塗り、アンケート調査、本の寄付など）を行い、写真やメモと共にContributionを記録する。これにより、参加者の「草（活動ヒートマップ）」が育っていく。
4. **Badgeの付与:** 素晴らしい提案や地道な貢献に対して、ユーザー同士でBadge（「継続」「着眼点」「協働」など）とコメントを贈り合う。適当な乱発を防ぐため、Badge付与には理由（コメント）を必須とする。

## 5. UI/UXデザイン方針

* **ストイックさの排除:** GitHubのような黒ベース・無機質なUIではなく、白やアースカラーを基調とした、余白の多いクリーンで温かいデザイン（Notionなどに近いトーン）。
* **活動の可視化:** 従来の緑の四角い「草」ではなく、水彩画のようなヒートマップや、スタンプが押されていくような、視覚的に達成感と癒やしを得られる表現を採用する。
* **承認の演出:** Badgeの通知は、ゲームの実績解除のような派手なものではなく、「手紙が届いた」ような静かで嬉しい演出にする。

## 6. データ構造 (Lexicon定義)

AT Protocol上で動作する、本アプリの中核となる4つのLexiconスキーマ（MVP版）。

### 6.1 Quest (プロジェクトの器)

```json
{
  "lexicon": 1,
  "id": "app.athub.repo",
  "defs": {
    "main": {
      "type": "record",
      "key": "tid",
      "record": {
        "type": "object",
        "required": ["name", "createdAt"],
        "properties": {
          "name": { "type": "string", "maxLength": 100 },
          "description": { "type": "string", "maxLength": 1000 },
          "topics": { "type": "array", "items": { "type": "string" } },
          "createdAt": { "type": "datetime" }
        }
      }
    }
  }
}

```

### 6.2 Proposal (提案・議論)

*※DDSのAnalyzerが読み取りやすいよう、将来的にメタデータタグを拡張可能な構造とする。*

```json
{
  "lexicon": 1,
  "id": "app.athub.issue",
  "defs": {
    "main": {
      "type": "record",
      "key": "tid",
      "record": {
        "type": "object",
        "required": ["repoRef", "title", "state", "createdAt"],
        "properties": {
          "repoRef": { "type": "ref", "ref": "com.atproto.repo.strongRef" },
          "title": { "type": "string", "maxLength": 100 },
          "body": { "type": "string", "maxLength": 3000 },
          "state": { "type": "string", "knownValues": ["open", "closed"] },
          "createdAt": { "type": "datetime" }
        }
      }
    }
  }
}

```

### 6.3 Contribution (行動記録)

```json
{
  "lexicon": 1,
  "id": "app.athub.commit",
  "defs": {
    "main": {
      "type": "record",
      "key": "tid",
      "record": {
        "type": "object",
        "required": ["repoRef", "message", "createdAt"],
        "properties": {
          "repoRef": { "type": "ref", "ref": "com.atproto.repo.strongRef" },
          "message": { "type": "string", "maxLength": 300 },
          "body": { "type": "string", "maxLength": 3000 },
          "media": { "type": "array", "description": "活動の証拠となる写真などの添付" },
          "createdAt": { "type": "datetime" }
        }
      }
    }
  }
}

```

### 6.4 Badge (社会的承認)

```json
{
  "lexicon": 1,
  "id": "app.athub.award",
  "defs": {
    "main": {
      "type": "record",
      "key": "tid",
      "record": {
        "type": "object",
        "required": ["subject", "badgeType", "comment", "createdAt"],
        "properties": {
          "subject": { "type": "ref", "ref": "com.atproto.repo.strongRef" },
          "badgeType": {
            "type": "string",
            "knownValues": ["continuous", "insightful", "collaborator", "brave"]
          },
          "comment": { "type": "string", "maxLength": 300, "description": "付与理由（必須にしてインフレを防ぐ）" },
          "createdAt": { "type": "datetime" }
        }
      }
    }
  }
}

```
