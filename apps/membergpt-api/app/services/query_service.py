from sqlalchemy import text


def find_member(db, question):
    # get all members and check if any name appears in the question
    members = db.execute(
        text('SELECT id, "fullName" FROM "Member" ORDER BY "fullName" ASC')
    ).fetchall()

    question_lower = question.lower()

    for member_id, full_name in members:
        if full_name is None:
            continue
        # check full name first
        if full_name.lower() in question_lower:
            return (member_id, full_name)

    # try matching just the first name
    for member_id, full_name in members:
        if full_name is None:
            continue
        first_name = full_name.split()[0].lower()
        if first_name in question_lower:
            return (member_id, full_name)

    return None


def get_scans(db, member_id):
    rows = db.execute(
        text("""
            SELECT
                m."fullName",
                s."scanDate",
                s."weightKg",
                s."bodyFatPercent",
                s."fatMassKg",
                s."leanMassKg",
                s."visceralFatMassKg",
                s."boneMassKg",
                s."bmrKcal",
                s."trunkFatKg",
                s."trunkLeanMassKg",
                s."androidFatPercent",
                s."gynoidFatPercent"
            FROM "Scan" s
            JOIN "Member" m ON m.id = s."memberId"
            WHERE m.id = :member_id
            ORDER BY s."scanDate" ASC
        """),
        {"member_id": member_id},
    ).fetchall()
    return rows


def answer_from_sql(db, question: str) -> str:
    q = question.lower().strip()
    member = find_member(db, q)
    member_id = member[0] if member else None

    # how many members have 3+ scans
    if "how many members" in q and ("3" in q or "three" in q):
        # get all member ids that have 3 or more scans
        all_members = db.execute(
            text('SELECT DISTINCT "memberId" FROM "Scan"')
        ).fetchall()

        count = 0
        for (mid,) in all_members:
            scan_count = db.execute(
                text('SELECT COUNT(*) FROM "Scan" WHERE "memberId" = :id'),
                {"id": mid}
            ).scalar()
            if scan_count >= 3:
                count += 1

        return f"{count} members have had 3 or more scans."

    # which members lost lean mass between last two scans
    if "lost lean mass" in q or ("lean mass" in q and "lost" in q):
        all_members = db.execute(
            text('SELECT DISTINCT "memberId" FROM "Scan"')
        ).fetchall()

        lost = []
        for (mid,) in all_members:
            scans = db.execute(
                text("""
                    SELECT m."fullName", s."leanMassKg"
                    FROM "Scan" s
                    JOIN "Member" m ON m.id = s."memberId"
                    WHERE s."memberId" = :id
                    ORDER BY s."scanDate" DESC
                    LIMIT 2
                """),
                {"id": mid}
            ).fetchall()

            if len(scans) == 2 and scans[0][1] < scans[1][1]:
                name = scans[0][0]
                decrease = scans[1][1] - scans[0][1]
                lost.append(f"{name} ({decrease:.1f} kg decrease)")

        if not lost:
            return "No members have lost lean mass between their last two scans."

        return f"These members lost lean mass between their last two scans: {', '.join(lost)}."

    # if no specific member found but question sounds member-specific
    if not member_id and any(word in q for word in ["body fat", "lean mass", "scan", "trend", "focus"]):
        all_members = db.execute(
            text('SELECT "fullName" FROM "Member" ORDER BY "fullName" ASC')
        ).fetchall()
        names = ", ".join(row[0] for row in all_members)
        return f"Please tell me which member you mean. Available members: {names}."

    # general question with no member found
    if not member_id:
        return (
            "I can answer questions about member scan data. "
            "Try asking about body fat trends, lean mass changes, scan counts, "
            "or coaching focus for a specific member."
        )

    rows = get_scans(db, member_id)
    if not rows:
        return "I could not find scan data for that member."

    full_name = rows[-1][0]
    latest = rows[-1]
    previous = rows[-2] if len(rows) >= 2 else None
    oldest = rows[0]

    # latest body fat
    if "body fat" in q and any(w in q for w in ["today", "current", "latest", "now"]):
        return (
            f"{full_name}'s latest body fat is {latest[3]:.1f}% "
            f"from the scan on {latest[1].strftime('%Y-%m-%d')}."
        )

    # body fat trend
    if "body fat" in q and any(w in q for w in ["trend", "history", "progress"]):
        if len(rows) == 1:
            return f"{full_name} only has one scan so there is no trend yet. Current body fat: {latest[3]:.1f}%."

        trend_parts = []
        for row in rows:
            trend_parts.append(f"{row[1].strftime('%Y-%m-%d')}: {row[3]:.1f}%")

        trend = "; ".join(trend_parts)
        change = latest[3] - oldest[3]
        return f"Body fat trend for {full_name}: {trend}. Overall change: {change:+.1f} percentage points."

    # lean mass trend
    if "lean mass" in q and any(w in q for w in ["trend", "history", "progress", "change"]):
        if len(rows) == 1:
            return f"{full_name} only has one scan so there is no trend yet. Current lean mass: {latest[5]:.1f} kg."

        trend_parts = []
        for row in rows:
            trend_parts.append(f"{row[1].strftime('%Y-%m-%d')}: {row[5]:.1f} kg")

        trend = "; ".join(trend_parts)
        change = latest[5] - oldest[5]
        return f"Lean mass trend for {full_name}: {trend}. Overall change: {change:+.1f} kg."

    # scan count
    if "how many scans" in q or "scan count" in q:
        return f"{full_name} has {len(rows)} recorded scan{'s' if len(rows) != 1 else ''}."

    # what changed between scans
    if "what changed" in q or "since last" in q:
        if not previous:
            return f"{full_name} only has one scan so nothing to compare yet."

        return (
            f"From previous to latest scan for {full_name}: "
            f"weight changed by {latest[2] - previous[2]:+.1f} kg, "
            f"body fat changed by {latest[3] - previous[3]:+.1f}%, "
            f"fat mass changed by {latest[4] - previous[4]:+.1f} kg, "
            f"lean mass changed by {latest[5] - previous[5]:+.1f} kg."
        )

    # coaching focus
    if "focus" in q or "coaching" in q or "next session" in q:
        if not previous:
            return (
                f"{full_name} only has one scan. I would focus on helping them understand "
                f"their baseline numbers before making any changes."
            )

        lean_change = latest[5] - previous[5]
        fat_change = latest[4] - previous[4]
        body_fat_change = latest[3] - previous[3]

        if lean_change < 0:
            return (
                f"For {full_name}, focus on rebuilding lean mass. "
                f"They lost {abs(lean_change):.1f} kg of lean mass since the last scan."
            )

        if fat_change > 0 or body_fat_change > 0:
            return (
                f"For {full_name}, focus on nutrition and activity. "
                f"Fat mass went up {fat_change:+.1f} kg and body fat changed {body_fat_change:+.1f}% since last scan."
            )

        return (
            f"For {full_name}, keep doing what they are doing. "
            f"Lean mass and body fat are both trending in the right direction."
        )

    # default: give a summary of the member
    summary = f"{full_name} has {len(rows)} scan{'s' if len(rows) != 1 else ''}. "
    summary += (
        f"Latest scan on {latest[1].strftime('%Y-%m-%d')}: "
        f"weight {latest[2]:.1f} kg, body fat {latest[3]:.1f}%, "
        f"fat mass {latest[4]:.1f} kg, lean mass {latest[5]:.1f} kg."
    )

    if previous:
        summary += (
            f" Compared to the previous scan: "
            f"weight {latest[2] - previous[2]:+.1f} kg, "
            f"body fat {latest[3] - previous[3]:+.1f}%, "
            f"lean mass {latest[5] - previous[5]:+.1f} kg."
        )

    return summary
