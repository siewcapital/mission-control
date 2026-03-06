#!/bin/bash
# PR Tracker - Auto-check all OSS PRs every hour
# Runs from Mission Control

LOG_FILE="/Users/siewbrayden/Desktop/Siew's Capital/MissionControl/logs/pr-tracker.log"
DATA_FILE="/Users/siewbrayden/Desktop/Siew's Capital/MissionControl/dist/tasks.json"

echo "[$(date)] PR Tracker starting..." >> $LOG_FILE

# Check each PR status
cd /Users/siewbrayden/.openclaw/workspace

# LangChain #35552
STATUS=$(gh pr view 35552 --repo langchain-ai/langchain --json state,merged -q '.state' 2>/dev/null || echo "unknown")
echo "[$(date)] LangChain #35552: $STATUS" >> $LOG_FILE

# Ollama #14637
STATUS=$(gh pr view 14637 --repo ollama/ollama --json state -q '.state' 2>/dev/null || echo "unknown")
echo "[$(date)] Ollama #14637: $STATUS" >> $LOG_FILE

# Continue PRs
STATUS=$(gh pr view 11078 --repo continuedev/continue --json state -q '.state' 2>/dev/null || echo "unknown")
echo "[$(date)] Continue #11078: $STATUS" >> $LOG_FILE

STATUS=$(gh pr view 11091 --repo continuedev/continue --json state -q '.state' 2>/dev/null || echo "unknown")
echo "[$(date)] Continue #11091: $STATUS" >> $LOG_FILE

STATUS=$(gh pr view 11094 --repo continuedev/continue --json state -q '.state' 2>/dev/null || echo "unknown")
echo "[$(date)] Continue #11094: $STATUS" >> $LOG_FILE

# Zed #50816
STATUS=$(gh pr view 50816 --repo zed-industries/zed --json state -q '.state' 2>/dev/null || echo "unknown")
echo "[$(date)] Zed #50816: $STATUS" >> $LOG_FILE

# shadcn/ui #9800
STATUS=$(gh pr view 9800 --repo shadcn-ui/ui --json state -q '.state' 2>/dev/null || echo "unknown")
echo "[$(date)] shadcn/ui #9800: $STATUS" >> $LOG_FILE

# TailwindCSS #19759
STATUS=$(gh pr view 19759 --repo tailwindlabs/tailwindcss --json state -q '.state' 2>/dev/null || echo "unknown")
echo "[$(date)] TailwindCSS #19759: $STATUS" >> $LOG_FILE

# Pydantic PRs
STATUS=$(gh pr view 12897 --repo pydantic/pydantic --json state -q '.state' 2>/dev/null || echo "unknown")
echo "[$(date)] Pydantic #12897: $STATUS" >> $LOG_FILE

STATUS=$(gh pr view 12898 --repo pydantic/pydantic --json state -q '.state' 2>/dev/null || echo "unknown")
echo "[$(date)] Pydantic #12898: $STATUS" >> $LOG_FILE

# Pandas PRs
STATUS=$(gh pr view 64417 --repo pandas-dev/pandas --json state -q '.state' 2>/dev/null || echo "unknown")
echo "[$(date)] Pandas #64417: $STATUS" >> $LOG_FILE

STATUS=$(gh pr view 64416 --repo pandas-dev/pandas --json state -q '.state' 2>/dev/null || echo "unknown")
echo "[$(date)] Pandas #64416: $STATUS" >> $LOG_FILE

echo "[$(date)] PR Tracker completed" >> $LOG_FILE
