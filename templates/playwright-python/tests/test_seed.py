from playwright.sync_api import Page, expect


def test_seed(page: Page) -> None:
    """
    Seed test — entry point for AI agents.

    This test bootstraps the page context that the planner and generator
    agents use as their starting point.

    How to use with agents:
      # Prompt your AI tool:
      #   "Use the planner agent. Seed: tests/test_seed.py"
    """
    page.goto("/")
    expect(page).not_to_have_title("")
