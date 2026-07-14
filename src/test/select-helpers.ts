import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Opens a base-ui `Select` (which renders a `<button role="combobox">` plus a
 * portal `listbox`) and chooses an option by text.
 *
 * base-ui `Select`s are NOT native `<select>` elements, so `fireEvent.change`
 * and `userEvent.selectOptions` do not apply — the trigger must be clicked to
 * mount the popup, then the target `option` clicked. Always await both steps
 * because the popup mounts asynchronously in a portal.
 */
export async function chooseSelectOption(
  trigger: HTMLElement,
  optionText: string | RegExp,
): Promise<void> {
  const user = userEvent.setup();
  await user.click(trigger);
  const option = await screen.findByRole("option", { name: optionText });
  await user.click(option);
}
