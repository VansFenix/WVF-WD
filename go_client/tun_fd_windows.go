//go:build windows

package main

import (
	"errors"
	"os"
)

func recvTunFD(sockPath string) (*os.File, error) {
	return nil, errors.New("rawtun mode is not supported on Windows (use SOCKS5 or WireGuard)")
}
