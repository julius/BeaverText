#!/bin/bash
#
#
#   BeaverText Installation (tested on Ubuntu with Gnome)
#
#   - creates ~/.local/share/applications/BeaverText.desktop
#
#

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

if [[ ! -d "$HOME/.local/share/applications" ]]; then
    echo "ERROR: Expected $HOME/.local/share/applications to exist."
    exit 1
fi

if [[ -e "$HOME/.local/share/applications/BeaverText.desktop" ]]; then
    rm "$HOME/.local/share/applications/BeaverText.desktop"
fi

sed "s/DIR/${DIR//\//\\\/}/g" "$DIR/BeaverText.desktop.template" > "$HOME/.local/share/applications/BeaverText.desktop"

