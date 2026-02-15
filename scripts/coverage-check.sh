#!/usr/bin/env bash

#
# CCW Knowledge Base Coverage Checker
# 
# Validates knowledge base documentation coverage.
#
# Usage:
#   ./coverage-check.sh [--json] [--verbose]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
JSON_OUTPUT=false
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Configuration
KNOWLEDGE_BASE="$PROJECT_ROOT/docs/knowledge-base"
MIN_COVERAGE=80

# Count functions
count_md_files() {
    find "$1" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' '
}

count_source_modules() {
    local path="$1"
    if [ -d "$path" ]; then
        find "$path" -name "*.ts" -o -name "*.js" 2>/dev/null | grep -v ".test." | grep -v ".spec." | wc -l | tr -d ' '
    else
        echo 0
    fi
}

# Check knowledge base structure
check_structure() {
    local errors=0
    
    if [ "$JSON_OUTPUT" = false ]; then
        echo -e "${BLUE}🔍 Checking Knowledge Base Structure...${NC}"
    fi
    
    # Check required directories
    for dir in architecture commands skills mcp servers; do
        if [ ! -d "$KNOWLEDGE_BASE/$dir" ]; then
            if [ "$JSON_OUTPUT" = false ]; then
                echo -e "  ${RED}✗ Missing directory: $dir${NC}"
            fi
            ((errors++))
        else
            if [ "$VERBOSE" = true ] && [ "$JSON_OUTPUT" = false ]; then
                echo -e "  ${GREEN}✓ Found directory: $dir${NC}"
            fi
        fi
    done
    
    # Check required files
    for file in README.md schema.json; do
        if [ ! -f "$KNOWLEDGE_BASE/$file" ]; then
            if [ "$JSON_OUTPUT" = false ]; then
                echo -e "  ${RED}✗ Missing file: $file${NC}"
            fi
            ((errors++))
        else
            if [ "$VERBOSE" = true ] && [ "$JSON_OUTPUT" = false ]; then
                echo -e "  ${GREEN}✓ Found file: $file${NC}"
            fi
        fi
    done
    
    return $errors
}

# Check documentation coverage
check_coverage() {
    local total_docs=0
    local expected_docs=5  # One per category
    
    for dir in architecture commands skills mcp servers; do
        local count=$(count_md_files "$KNOWLEDGE_BASE/$dir")
        total_docs=$((total_docs + count))
    done
    
    local coverage=0
    if [ $total_docs -ge $expected_docs ]; then
        coverage=100
    else
        coverage=$((total_docs * 100 / expected_docs))
    fi
    
    if [ "$JSON_OUTPUT" = false ]; then
        echo ""
        echo -e "${BLUE}📊 Coverage Summary${NC}"
        echo "  Documentation files: $total_docs"
        echo "  Coverage: ${coverage}%"
    fi
    
    if [ $coverage -ge $MIN_COVERAGE ]; then
        if [ "$JSON_OUTPUT" = false ]; then
            echo -e "  ${GREEN}✅ PASS${NC} (minimum: ${MIN_COVERAGE}%)"
        fi
        return 0
    else
        if [ "$JSON_OUTPUT" = false ]; then
            echo -e "  ${RED}❌ FAIL${NC} (minimum: ${MIN_COVERAGE}%)"
        fi
        return 1
    fi
}

# Main
main() {
    if [ "$JSON_OUTPUT" = false ]; then
        echo ""
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║       CCW Knowledge Base Coverage Checker                  ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
    fi
    
    local struct_result=0
    local coverage_result=0
    
    check_structure || struct_result=$?
    check_coverage || coverage_result=$?
    
    if [ "$JSON_OUTPUT" = true ]; then
        local passed="true"
        if [ $struct_result -gt 0 ] || [ $coverage_result -gt 0 ]; then
            passed="false"
        fi
        echo "{\"passed\": $passed, \"structure_errors\": $struct_result, \"coverage_result\": $coverage_result}"
    fi
    
    if [ $struct_result -gt 0 ] || [ $coverage_result -gt 0 ]; then
        exit 1
    fi
    
    exit 0
}

main
